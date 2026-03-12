import express from "express";
import { pool } from "../db.js";
import { memberAuth } from "../middleware/memberAuth.js";

const router = express.Router();

/**
 * GET /member/me
 * Returns logged in member profile
 */
router.get("/me", memberAuth, async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT 
        m.id,
        m.short_id,
        m.nickname,
        m.email,  
        m.phone,
        m.country,            
        m.created_at,
        m.last_login,         
        m.avatar_url,
        m.approval_status,      
        m.ranking,
        m.withdraw_privilege,
        u.short_id AS sponsor_short_id,

        COALESCE(w.balance, 0)::numeric(12,2)        AS balance,
        COALESCE(w.locked_balance, 0)::numeric(12,2) AS locked_balance
      FROM members m
      JOIN users u ON u.id = m.sponsor_id
      LEFT JOIN wallets w ON w.member_id = m.id
      WHERE m.id = $1
      `,
      [req.member.member_id]
    );

    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /member/me  (member edits own email only)
router.patch("/me", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const email = String(req.body.email ?? "").trim();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) return res.status(400).json({ message: "Invalid email format" });

    const r = await pool.query(
      `
      UPDATE members
      SET email = $1
      WHERE id = $2
      RETURNING id, short_id, nickname, email
      `,
      [email, memberId]
    );

    res.json(r.rows[0] || null);
  } catch (e) {
    const msg = String(e);
    // your DB constraint is UNIQUE (lower(email)) -> name: members_email_key
    if (msg.includes("members_email_key")) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /member/dashboard
 * One-call endpoint for VIP pages:
 * - member profile + wallet (balance, locked_balance, ranking, sponsor_short_id, etc)
 * - summary stats (today/week/lifetime tasks & commission)
 */
router.get("/dashboard", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    // 1) member + wallet (same shape as /me but includes extra useful fields)
    const meRes = await pool.query(
      `
      SELECT 
        m.id,
        m.short_id,
        m.nickname,
        m.email, 
        m.phone,
        m.country,
        m.ranking,
        m.withdraw_privilege,
        m.approval_status,
        m.gender,
        u.short_id AS sponsor_short_id,

        COALESCE(w.balance, 0)::numeric(12,2)         AS balance,
        COALESCE(w.locked_balance, 0)::numeric(12,2)  AS locked_balance
      FROM members m
      LEFT JOIN users u ON u.id = m.sponsor_id
      LEFT JOIN wallets w ON w.member_id = m.id
      WHERE m.id = $1
      `,
      [memberId]
    );

    // 2) performance summary
    const sumRes = await pool.query(
      `
      WITH w AS (
        SELECT
          now() - interval '24 hours' AS since_24h,
          now() - interval '7 days'  AS since_7d
      )
      SELECT
        /* LAST 24 HOURS */
        COUNT(DISTINCT CASE WHEN mth.created_at >= w.since_24h THEN mth.member_set_id END)::int AS today_sets,
        COUNT(CASE WHEN mth.created_at >= w.since_24h THEN mth.id END)::int AS today_tasks,
        COALESCE(SUM(CASE WHEN mth.created_at >= w.since_24h THEN mth.commission_amount END), 0)::numeric(12,2) AS today_commission,

        /* LAST 7 DAYS */
        COUNT(DISTINCT CASE WHEN mth.created_at >= w.since_7d THEN mth.member_set_id END)::int AS week_sets,
        COUNT(CASE WHEN mth.created_at >= w.since_7d THEN mth.id END)::int AS week_tasks,
        COALESCE(SUM(CASE WHEN mth.created_at >= w.since_7d THEN mth.commission_amount END), 0)::numeric(12,2) AS week_commission,

        /* LIFETIME */
        COUNT(DISTINCT mth.member_set_id)::int AS lifetime_sets,
        COUNT(mth.id)::int AS lifetime_tasks,
        COALESCE(SUM(mth.commission_amount), 0)::numeric(12,2) AS lifetime_commission
      FROM member_task_history mth
      CROSS JOIN w
      WHERE mth.member_id = $1
      `,
      [memberId]
    );

    res.json({
      me: meRes.rows[0] || null,
      summary:
        sumRes.rows[0] || {
          today_sets: 0,
          today_tasks: 0,
          today_commission: "0.00",
          week_sets: 0,
          week_tasks: 0,
          week_commission: "0.00",
          lifetime_sets: 0,
          lifetime_tasks: 0,
          lifetime_commission: "0.00",
        },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /member/active-set
 */
router.get("/active-set", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const sponsorRes = await pool.query(
      `
      SELECT u.short_id AS sponsor_short_id
      FROM members m
      LEFT JOIN users u ON u.id = m.sponsor_id
      WHERE m.id = $1
      `,
      [memberId]
    );

    const sponsor_short_id = sponsorRes.rows[0]?.sponsor_short_id || null;

    const msRes = await pool.query(
      `
      SELECT *
      FROM member_sets
      WHERE member_id = $1 AND status = 'active'
      ORDER BY id DESC
      LIMIT 1
      `,
      [memberId]
    );

    const ms = msRes.rows[0];
    if (!ms) {
      return res.json({ active: false, message: "No active set assigned" });
    }

    const currentIndex = Number(ms.current_task_index || 0);

// totals + set amount (✅ includes overrides per member_set_id)
const totalsRes = await pool.query(
  `
  SELECT 
    COUNT(st.task_id)::int AS total_tasks,
    COALESCE(SUM(t.rate * COALESCE(msto.quantity_override, t.quantity)), 0)::numeric(12,2) AS set_amount,
    COALESCE(SUM((t.rate * COALESCE(msto.quantity_override, t.quantity)) * (t.commission_rate / 100.0)), 0)::numeric(12,2) AS set_commission    
  FROM set_tasks st
  JOIN tasks t ON t.id = st.task_id
  LEFT JOIN member_set_task_overrides msto
    ON msto.member_set_id = $2
   AND msto.set_task_id = st.id
  WHERE st.set_id = $1
  `,
  [ms.set_id, ms.id] // ✅ IMPORTANT: pass member_set_id
);

const total_tasks = totalsRes.rows[0]?.total_tasks || 0;
const set_amount = totalsRes.rows[0]?.set_amount || "0.00";
const set_commission = totalsRes.rows[0]?.set_commission || "0.00";

// ✅ get ALL tasks of this set (ordered) + overrides + computed amount/commission
const allTasksRes = await pool.query(
  `
  SELECT 
    t.id,
    t.title,
    t.description,
    t.image_url,
    t.rate,
    t.commission_rate,
    t.price,
    t.task_type,

    t.quantity AS base_quantity,
    msto.quantity_override,
    COALESCE(msto.quantity_override, t.quantity) AS quantity_effective,

    (t.rate * COALESCE(msto.quantity_override, t.quantity))::numeric(12,2) AS task_amount,
    ((t.rate * COALESCE(msto.quantity_override, t.quantity)) * (t.commission_rate / 100.0))::numeric(12,2) AS task_commission    

  FROM set_tasks st
  JOIN tasks t ON t.id = st.task_id
  LEFT JOIN member_set_task_overrides msto
    ON msto.member_set_id = $2
   AND msto.set_task_id = st.id
  WHERE st.set_id = $1
  ORDER BY st.position ASC, st.id ASC
  `,
  [ms.set_id, ms.id]
);

const tasks = allTasksRes.rows || [];
const current_task = tasks[currentIndex] || null;

    const setRes = await pool.query(
      `
      SELECT id, name, max_tasks, created_at
      FROM sets
      WHERE id = $1
      `,
      [ms.set_id]
    );

    res.json({
      active: true,
      sponsor_short_id,
      assignment: {
        id: ms.id,
        status: ms.status,
        current_task_index: ms.current_task_index,
        created_at: ms.created_at,
        updated_at: ms.updated_at,
      },
      set: setRes.rows[0] || null,

      total_tasks,
      set_amount,
      set_commission,

      // ✅ IMPORTANT: full tasks list for next/previous
      tasks,

      // keep for compatibility
      last_completed_task_number: currentIndex,
      current_task,
      current_task_amount: current_task?.task_amount ?? current_task?.rate ?? null,// ✅ use computed amount

    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /member/complete-task
 */
router.post("/complete-task", memberAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const memberId = req.member.member_id;

    await client.query("BEGIN");

    const msRes = await client.query(
      `
      SELECT *
      FROM member_sets
      WHERE member_id = $1 AND status = 'active'
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `,
      [memberId]
    );

    const ms = msRes.rows[0];
    if (!ms) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No active set" });
    }

    const totalsRes = await client.query(
      `
      SELECT COUNT(*)::int AS total_tasks
      FROM set_tasks
      WHERE set_id = $1
      `,
      [ms.set_id]
    );

    const totalTasks = totalsRes.rows[0]?.total_tasks || 0;
    if (totalTasks === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This set has no tasks" });
    }

    const currentIndex = Number(ms.current_task_index || 0);
    if (currentIndex >= totalTasks) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Set already completed" });
    }

const taskRes = await client.query(
  `
  SELECT
    t.id,
    t.rate,
    t.commission_rate,
    COALESCE(msto.quantity_override, t.quantity) AS quantity_effective,
    (t.rate * COALESCE(msto.quantity_override, t.quantity))::numeric(12,2) AS task_amount
  FROM set_tasks st
  JOIN tasks t ON t.id = st.task_id
  LEFT JOIN member_set_task_overrides msto
    ON msto.member_set_id = $2
   AND msto.set_task_id = st.id
  WHERE st.set_id = $1
  ORDER BY st.position ASC, st.id ASC
  OFFSET $3
  LIMIT 1
  `,
  [ms.set_id, ms.id, currentIndex]
);

    const t = taskRes.rows[0];
    if (!t) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No current task" });
    }

    const commissionAmount = Number(t.task_amount) * (Number(t.commission_rate) / 100);

    // 1) log task completion
    const histRes = await client.query(
      `
      INSERT INTO member_task_history (member_id, member_set_id, set_id, task_id, commission_amount)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [memberId, ms.id, ms.set_id, t.id, commissionAmount]
    );

    const historyId = histRes.rows[0].id;

    // 2) ensure wallet exists
    await client.query(
      `INSERT INTO wallets(member_id) VALUES($1)
       ON CONFLICT (member_id) DO NOTHING`,
      [memberId]
    );

    // 3) ledger insert (prevents double credit if API called twice)
    const led = await client.query(
      `
      INSERT INTO wallet_ledger (member_id, type, direction, amount, ref_type, ref_id, note)
      VALUES ($1, 'commission', 'credit', $2, 'task', $3, 'Task commission')
      ON CONFLICT (ref_type, ref_id) DO NOTHING
      RETURNING id
      `,
      [memberId, commissionAmount, historyId]
    );

    // 4) only credit wallet if ledger row was inserted
    if (led.rowCount > 0) {
      await client.query(
        `
        UPDATE wallets
        SET balance = balance + $1,
            updated_at = now()
        WHERE member_id = $2
        `,
        [commissionAmount, memberId]
      );
    }

    // progress forward
    const nextIndex = currentIndex + 1;

    if (nextIndex >= totalTasks) {
      const done = await client.query(
        `
        UPDATE member_sets
        SET status = 'completed',
            current_task_index = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [ms.id, totalTasks]
      );

      await client.query("COMMIT");
      return res.json({
        message: "Set completed",
        assignment: done.rows[0],
        logged_task_id: t.id,
        commission_amount: commissionAmount,
      });
    }

    const upd = await client.query(
      `
      UPDATE member_sets
      SET current_task_index = $2,
          updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [ms.id, nextIndex]
    );

    await client.query("COMMIT");
    res.json({
      message: "Task completed",
      assignment: upd.rows[0],
      logged_task_id: t.id,
      commission_amount: commissionAmount,
    });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

/**
 * GET /member/my-sets
 * Member-only: list my assigned sets (active + completed) with progress + amounts + earned commission
 */
router.get("/my-sets", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const q = `
      WITH set_task_rows AS (
        SELECT
          st.set_id,
          st.task_id,
          ROW_NUMBER() OVER (PARTITION BY st.set_id ORDER BY st.id ASC) AS rn
        FROM set_tasks st
      ),
      set_stats AS (
        SELECT
          s.id AS set_id,
          COUNT(t.id)::int AS total_tasks,
          COALESCE(SUM(t.rate), 0)::numeric(12,2) AS set_amount
        FROM sets s
        LEFT JOIN set_tasks st ON st.set_id = s.id
        LEFT JOIN tasks t ON t.id = st.task_id
        GROUP BY s.id
      ),
      current_task_price AS (
        SELECT
          ms.id AS member_set_id,
          COALESCE(t.rate, 0)::numeric(12,2) AS current_task_amount
        FROM member_sets ms
        LEFT JOIN set_task_rows str
          ON str.set_id = ms.set_id
         AND str.rn = (ms.current_task_index + 1)
        LEFT JOIN tasks t ON t.id = str.task_id
        WHERE ms.member_id = $1
      ),
      earned AS (
        SELECT
          mth.member_set_id,
          COALESCE(SUM(mth.commission_amount), 0)::numeric(12,2) AS earned_commission
        FROM member_task_history mth
        WHERE mth.member_id = $1
        GROUP BY mth.member_set_id
      )
      SELECT
        ms.id,
        ms.current_task_index,
        ms.created_at,
        ms.updated_at,

        s.id AS set_id,
        s.name AS set_name,
        s.max_tasks,

        ss.total_tasks,
        ss.set_amount,
        ctp.current_task_amount,

        COALESCE(e.earned_commission, 0)::numeric(12,2) AS earned_commission,

        CASE
          WHEN ms.current_task_index >= COALESCE(ss.total_tasks, 0) AND COALESCE(ss.total_tasks, 0) > 0
            THEN 'completed'
          ELSE ms.status
        END AS status

      FROM member_sets ms
      JOIN sets s ON s.id = ms.set_id
      LEFT JOIN set_stats ss ON ss.set_id = s.id
      LEFT JOIN current_task_price ctp ON ctp.member_set_id = ms.id
      LEFT JOIN earned e ON e.member_set_id = ms.id
      WHERE ms.member_id = $1
      ORDER BY ms.created_at DESC
    `;

    const r = await pool.query(q, [memberId]);
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /member/history
 * Returns completed sets
 */
router.get("/history", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const r = await pool.query(
      `
      SELECT 
        ms.id,
        ms.created_at,
        ms.updated_at,
        s.name AS set_name,
        COUNT(st.task_id)::int AS total_tasks,
        COALESCE(SUM(t.rate), 0)::numeric(12,2) AS set_amount
      FROM member_sets ms
      JOIN sets s ON s.id = ms.set_id
      LEFT JOIN set_tasks st ON st.set_id = s.id
      LEFT JOIN tasks t ON t.id = st.task_id
      WHERE ms.member_id = $1
        AND ms.status = 'completed'
      GROUP BY ms.id, s.name
      ORDER BY ms.updated_at DESC
      `,
      [memberId]
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /member/history-summary
 * Today = last 24 hours
 * Week  = last 7 days
 */
router.get("/history-summary", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const q = `
      WITH w AS (
        SELECT
          now() - interval '24 hours' AS since_24h,
          now() - interval '7 days'  AS since_7d
      )
      SELECT
        /* LAST 24 HOURS */
        COUNT(DISTINCT CASE WHEN mth.created_at >= w.since_24h THEN mth.member_set_id END)::int AS today_sets,
        COUNT(CASE WHEN mth.created_at >= w.since_24h THEN mth.id END)::int AS today_tasks,
        COALESCE(SUM(CASE WHEN mth.created_at >= w.since_24h THEN mth.commission_amount END), 0)::numeric(12,2) AS today_commission,

        /* LAST 7 DAYS */
        COUNT(DISTINCT CASE WHEN mth.created_at >= w.since_7d THEN mth.member_set_id END)::int AS week_sets,
        COUNT(CASE WHEN mth.created_at >= w.since_7d THEN mth.id END)::int AS week_tasks,
        COALESCE(SUM(CASE WHEN mth.created_at >= w.since_7d THEN mth.commission_amount END), 0)::numeric(12,2) AS week_commission,

        /* LIFETIME */
        COUNT(DISTINCT mth.member_set_id)::int AS lifetime_sets,
        COUNT(mth.id)::int AS lifetime_tasks,
        COALESCE(SUM(mth.commission_amount), 0)::numeric(12,2) AS lifetime_commission
      FROM member_task_history mth
      CROSS JOIN w
      WHERE mth.member_id = $1
    `;

    const r = await pool.query(q, [memberId]);

    // In case there are no rows at all yet
    res.json(
      r.rows[0] || {
        today_sets: 0,
        today_tasks: 0,
        today_commission: "0.00",
        week_sets: 0,
        week_tasks: 0,
        week_commission: "0.00",
        lifetime_sets: 0,
        lifetime_tasks: 0,
        lifetime_commission: "0.00",
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// MEMBER: create deposit request
router.post("/deposits", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const amount = Number(req.body.amount || 0);
    const method = String(req.body.method || "").trim();

    // ✅ NEW
    const asset = String(req.body.asset || "USDT").trim();
    const network = String(req.body.network || "").trim();

    const tx_ref_raw = (req.body.tx_ref ?? "").toString().trim();
    const proof_url = String(req.body.proof_url || "").trim();

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    if (!method)
      return res.status(400).json({ message: "Method required" });

    // ✅ crypto validation
    if (method.toLowerCase().includes("crypto") && !network) {
      return res.status(400).json({ message: "Network required for crypto deposit" });
    }

    const m = await pool.query(
      `SELECT approval_status FROM members WHERE id=$1`,
      [memberId]
    );

    if (!m.rowCount)
      return res.status(404).json({ message: "Member not found" });

    if (m.rows[0].approval_status !== "approved") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    const r = await pool.query(
      tx_ref_raw
        ? `
          INSERT INTO deposits
            (member_id, amount, method, asset, network, tx_ref, proof_url, source)
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,'member')
          RETURNING *
          `
        : `
          INSERT INTO deposits
            (member_id, amount, method, asset, network, proof_url, source)
          VALUES
            ($1,$2,$3,$4,$5,$6,'member')
          RETURNING *
          `,
      tx_ref_raw
        ? [memberId, amount, method, asset, network || null, tx_ref_raw, proof_url || null]
        : [memberId, amount, method, asset, network || null, proof_url || null]
    );

    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// MEMBER: list my deposits
router.get("/deposits", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const r = await pool.query(
      `SELECT
        id,
        amount,
        method,
        asset,
        network,
        tx_ref,
        proof_url,
        source,
        status,
        admin_note,
        created_at,
        reviewed_at
        FROM deposits      
        WHERE member_id = $1
        ORDER BY id DESC`,
      [memberId]
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// MEMBER: create withdrawal request (locks money immediately)
router.post("/withdrawals", memberAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const memberId = req.member.member_id;

    const amount = Number(req.body.amount || 0);

    // method: "crypto" | "bank" (accept also "Crypto"/"Bank")
    const methodRaw = String(req.body.method || "").trim();
    const method = methodRaw.toLowerCase();

    // crypto-only
    const asset = String(req.body.asset || "").trim();
    const network = String(req.body.network || "").trim();
    const wallet_address = String(req.body.wallet_address || "").trim();

    // bank-only
    const bank_country = String(req.body.bank_country || "").trim(); // e.g. KH
    const bank_name = String(req.body.bank_name || "").trim();       // e.g. ABA
    const account_holder_name = String(req.body.account_holder_name || "").trim();
    const account_number = String(req.body.account_number || "").trim();
    const routing_number = String(req.body.routing_number || "").trim(); // optional
    const branch_name = String(req.body.branch_name || "").trim();       // optional

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (!method) return res.status(400).json({ message: "Method required" });

    const isCrypto = method === "crypto";
    const isBank = method === "bank";
    if (!isCrypto && !isBank) {
      return res.status(400).json({ message: "Method must be crypto or bank" });
    }

    // ✅ method-specific required fields
    if (isCrypto) {
      if (!asset) return res.status(400).json({ message: "Asset required" });
      if (!network) return res.status(400).json({ message: "Network required" });
      if (!wallet_address) return res.status(400).json({ message: "Wallet address required" });
    }

    if (isBank) {
      if (!bank_country) return res.status(400).json({ message: "Bank country required" });
      if (!bank_name) return res.status(400).json({ message: "Bank name required" });
      if (!account_holder_name) return res.status(400).json({ message: "Account holder name required" });
      if (!account_number) return res.status(400).json({ message: "Account number required" });
    }

    // ✅ build account_details automatically (DB requires NOT NULL)
    const account_details = isCrypto
      ? `${asset} ${network} → ${wallet_address}`
      : `${bank_name} (${bank_country}) • ${account_holder_name} • ${account_number}`
          + (routing_number ? ` • Routing: ${routing_number}` : "")
          + (branch_name ? ` • Branch: ${branch_name}` : "");

    // member checks
    const m = await pool.query(
      `SELECT approval_status, withdraw_privilege FROM members WHERE id=$1`,
      [memberId]
    );
    if (!m.rowCount) return res.status(404).json({ message: "Member not found" });
    if (m.rows[0].approval_status !== "approved") {
      return res.status(403).json({ message: "Account not approved yet" });
    }
    if (!m.rows[0].withdraw_privilege) {
      return res.status(403).json({ message: "Withdraw not allowed" });
    }

    // ✅ NEW: block withdrawal while member has an active set
    const activeSet = await pool.query(
      `
      SELECT id
      FROM member_sets
      WHERE member_id = $1 AND status = 'active'
      LIMIT 1
      `,
      [memberId]
    );

    if (activeSet.rowCount > 0) {
      return res.status(409).json({
        message: "Withdrawal is not allowed while you have an active set. Please complete the set first.",
        code: "ACTIVE_SET_BLOCK",
      });
    }

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO wallets(member_id) VALUES($1)
       ON CONFLICT (member_id) DO NOTHING`,
      [memberId]
    );

    const w = await client.query(
      `SELECT balance, locked_balance FROM wallets WHERE member_id=$1 FOR UPDATE`,
      [memberId]
    );

    const bal = Number(w.rows[0]?.balance || 0);
    if (bal < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // lock money
    await client.query(
      `UPDATE wallets
       SET balance = balance - $1,
           locked_balance = locked_balance + $1,
           updated_at = now()
       WHERE member_id = $2`,
      [amount, memberId]
    );

    // insert withdrawal
    const wd = await client.query(
      `
      INSERT INTO withdrawals (
        member_id,
        amount,
        method,
        account_details,

        asset,
        network,
        wallet_address,

        bank_country,
        bank_name,
        account_holder_name,
        account_number,
        routing_number,
        branch_name
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,
        $8,$9,$10,$11,$12,$13
      )
      RETURNING *
      `,
      [
        memberId,
        amount,
        method,           // store "crypto" or "bank"
        account_details,

        isCrypto ? asset : null,
        isCrypto ? network : null,
        isCrypto ? wallet_address : null,

        isBank ? bank_country : null,
        isBank ? bank_name : null,
        isBank ? account_holder_name : null,
        isBank ? account_number : null,
        isBank ? (routing_number || null) : null,
        isBank ? (branch_name || null) : null,
      ]
    );

    await client.query("COMMIT");
    res.status(201).json(wd.rows[0]);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});


// MEMBER: list my withdrawals
router.get("/withdrawals", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const r = await pool.query(
      `SELECT
        id,
        amount,
        method,
        tx_ref,
        status,
        account_details,

        asset,
        network,
        wallet_address,

        bank_country,
        bank_name,
        account_holder_name,
        account_number,
        routing_number,
        branch_name,

        created_at,
        reviewed_at
      FROM withdrawals
      WHERE member_id = $1
      ORDER BY id DESC`,
      [memberId]
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /member/earnings
// Returns:
// - today_commission (calendar day)
// - yesterday_commission (calendar day)
// - balance, locked_balance
// - cash_gap (balance - current_task_price) ONLY when current task is combo; else 0
// - cash_gap_color: "red" | "green"
router.get("/earnings", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    // ✅ Ensure wallet always exists (prevents empty wallet edge-cases)
    await pool.query(
      `INSERT INTO wallets(member_id) VALUES($1)
       ON CONFLICT (member_id) DO NOTHING`,
      [memberId]
    );

    const q = `
      WITH b AS (
        SELECT
          date_trunc('day', now())                    AS today_start,
          date_trunc('day', now()) + interval '1 day' AS tomorrow_start,
          date_trunc('day', now()) - interval '1 day' AS yesterday_start
      ),
      w AS (
        SELECT
          COALESCE(balance, 0)::numeric(12,2)        AS balance,
          COALESCE(locked_balance, 0)::numeric(12,2) AS locked_balance
        FROM wallets
        WHERE member_id = $1
      ),
      agg AS (
        SELECT
          COALESCE(SUM(mth.commission_amount) FILTER (
            WHERE mth.created_at >= b.today_start
              AND mth.created_at <  b.tomorrow_start
          ), 0)::numeric(12,2) AS today_commission,

          COALESCE(SUM(mth.commission_amount) FILTER (
            WHERE mth.created_at >= b.yesterday_start
              AND mth.created_at <  b.today_start
          ), 0)::numeric(12,2) AS yesterday_commission
        FROM member_task_history mth
        CROSS JOIN b
        WHERE mth.member_id = $1
      ),
      ms AS (
        SELECT id, set_id, current_task_index
        FROM member_sets
        WHERE member_id = $1 AND status = 'active'
        ORDER BY id DESC
        LIMIT 1
      ),
current_task AS (
  SELECT
    t.id AS task_id,
    t.task_type,
    (t.rate * COALESCE(msto.quantity_override, t.quantity))::numeric(12,2) AS price
  FROM ms
  JOIN set_tasks st ON st.set_id = ms.set_id
  JOIN tasks t ON t.id = st.task_id
  LEFT JOIN member_set_task_overrides msto
    ON msto.member_set_id = ms.id
   AND msto.set_task_id = st.id
  ORDER BY st.position ASC, st.id ASC
  OFFSET COALESCE((SELECT current_task_index FROM ms), 0)
  LIMIT 1
)      
      SELECT
        COALESCE(agg.today_commission, 0)::numeric(12,2)      AS today_commission,
        COALESCE(agg.yesterday_commission, 0)::numeric(12,2)  AS yesterday_commission,

        COALESCE(w.balance, 0)::numeric(12,2)                 AS balance,
        COALESCE(w.locked_balance, 0)::numeric(12,2)          AS locked_balance,

        ct.task_type                                          AS current_task_type,
        COALESCE(ct.price, 0)::numeric(12,2)                  AS current_task_price,

        CASE
          WHEN ct.task_type = 'combo'
            THEN (COALESCE(w.balance, 0) - COALESCE(ct.price, 0))::numeric(12,2)
          ELSE 0::numeric(12,2)
        END AS cash_gap,

        CASE
          WHEN ct.task_type = 'combo' AND (COALESCE(w.balance, 0) - COALESCE(ct.price, 0)) < 0
            THEN 'red'
          ELSE 'green'
        END AS cash_gap_color

      FROM (SELECT 1) x
      LEFT JOIN agg ON true
      LEFT JOIN w   ON true
      LEFT JOIN current_task ct ON true
    `;

    const r = await pool.query(q, [memberId]);

    res.json(
      r.rows[0] || {
        today_commission: "0.00",
        yesterday_commission: "0.00",
        balance: "0.00",
        locked_balance: "0.00",
        current_task_type: null,
        current_task_price: "0.00",
        cash_gap: "0.00",
        cash_gap_color: "green",
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
