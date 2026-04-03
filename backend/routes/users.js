import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { createUserSchema } from "../validators.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return res.status(400).json({
      message: "Validation failed",
      fieldErrors,
    });
  }

  const { name, email, password, role } = parsed.data;

  if (req.user.role === "admin" && role !== "owner") {
    return res.status(403).json({ message: "Admin can only create owner" });
  }
  if (req.user.role === "owner" && role !== "agent") {
    return res.status(403).json({ message: "Owner can only create agent" });
  }
  if (req.user.role !== "admin" && req.user.role !== "owner") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    // ✅ DB trigger generates short_id (Mxxxxx / Axxxxx)
    const r = await pool.query(
      `INSERT INTO users (name, email, password, role, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, short_id, name, email, role, created_by, created_at`,
      [name, email, hash, role, req.user.id]
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    const msg = String(e);

    if (msg.includes("users_email_key")) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // optional: if short_id conflicts (should not happen with your DB loop)
    if (msg.includes("users_short_id_key") || msg.includes("short_id")) {
      return res.status(500).json({ message: "Short ID generation conflict" });
    }

    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  const r = await pool.query(
    `SELECT id, short_id, name, email, role, created_by, created_at, is_blocked
     FROM users
     ORDER BY id DESC`
  );
  return res.json(r.rows);
});

// DASHBOARD SUMMARY (GLOBAL for admin/owner/agent)
// Replace your existing /dashboard/summary route with this
router.get("/dashboard/summary", auth, async (req, res) => {
  try {
    const [
      usersTotal,
      usersByRole,
      // tasksTotal,
      // setsTotal,
      membersTotal,

      depositsAgg,
      withdrawalsAgg,

      supportAgg,
      comboSetsAgg,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM users`),
      pool.query(`SELECT role, COUNT(*)::int AS c FROM users GROUP BY role ORDER BY role`),
      // pool.query(`SELECT COUNT(*)::int AS c FROM tasks`),
      // pool.query(`SELECT COUNT(*)::int AS c FROM sets WHERE is_archived = false`),
      pool.query(`SELECT COUNT(*)::int AS c FROM members`),

      // deposits aggregation (lifetime + today + month)
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status='pending')::int AS pending,
          COUNT(*) FILTER (WHERE status='approved')::int AS approved,
          COALESCE(SUM(amount) FILTER (WHERE status='approved'), 0)::numeric(12,2) AS approved_amount,
          COALESCE(SUM(amount) FILTER (WHERE status='pending'), 0)::numeric(12,2) AS pending_amount,

          -- today
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_total,
          COALESCE(SUM(amount) FILTER (WHERE status='approved' AND created_at >= CURRENT_DATE), 0)::numeric(12,2) AS today_approved,
          COALESCE(SUM(amount) FILTER (WHERE status='pending' AND created_at >= CURRENT_DATE), 0)::numeric(12,2) AS today_pending,

          -- this month
          COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now()))::int AS month_total,
          COALESCE(SUM(amount) FILTER (WHERE status='approved' AND date_trunc('month', created_at) = date_trunc('month', now())), 0)::numeric(12,2) AS month_approved,
          COALESCE(SUM(amount) FILTER (WHERE status='pending' AND date_trunc('month', created_at) = date_trunc('month', now())), 0)::numeric(12,2) AS month_pending
        FROM deposits
      `),

      // withdrawals aggregation (lifetime + today + month)
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status='pending')::int AS pending,
          COUNT(*) FILTER (WHERE status='approved')::int AS approved,
          COALESCE(SUM(amount) FILTER (WHERE status='approved'), 0)::numeric(12,2) AS approved_amount,
          COALESCE(SUM(amount) FILTER (WHERE status='pending'), 0)::numeric(12,2) AS pending_amount,

          -- today
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_total,
          COALESCE(SUM(amount) FILTER (WHERE status='approved' AND created_at >= CURRENT_DATE), 0)::numeric(12,2) AS today_approved,
          COALESCE(SUM(amount) FILTER (WHERE status='pending' AND created_at >= CURRENT_DATE), 0)::numeric(12,2) AS today_pending,

          -- this month
          COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', now()))::int AS month_total,
          COALESCE(SUM(amount) FILTER (WHERE status='approved' AND date_trunc('month', created_at) = date_trunc('month', now())), 0)::numeric(12,2) AS month_approved,
          COALESCE(SUM(amount) FILTER (WHERE status='pending' AND date_trunc('month', created_at) = date_trunc('month', now())), 0)::numeric(12,2) AS month_pending
        FROM withdrawals
      `),

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='open')::int AS open,
          COUNT(*) FILTER (WHERE status='pending')::int AS pending,
          COUNT(*) FILTER (WHERE status='closed')::int AS closed
        FROM support_conversations
      `),

      // pool.query(`
      //   SELECT COUNT(*)::int AS c
      //   FROM (
      //     SELECT st.set_id
      //     FROM set_tasks st
      //     JOIN tasks t ON t.id = st.task_id
      //     WHERE t.task_type='combo'
      //     GROUP BY st.set_id
      //   ) x
      // `),
      
    ]);

    const byRole = {};
    for (const r of usersByRole.rows) byRole[r.role] = r.c;

    res.json({
      users: { total: usersTotal.rows[0].c, byRole },
      // tasks: { total: tasksTotal.rows[0].c },
      // sets: { total: setsTotal.rows[0].c, combo_sets: comboSetsAgg.rows[0].c },
      members: { total: membersTotal.rows[0].c },
      deposits: depositsAgg.rows[0],
      withdrawals: withdrawalsAgg.rows[0],
      support: supportAgg.rows[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load dashboard summary" });
  }
});

// RECENT TRANSACTIONS (GLOBAL)
router.get("/dashboard/recent", auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);

    const r = await pool.query(
      `
      SELECT * FROM (
        -- 1) ledger (commission/deposit/withdraw if you insert them)
        SELECT
          wl.id::text                AS id,
          wl.type                    AS type,
          wl.direction               AS direction,
          wl.amount                  AS amount,
          wl.ref_type                AS ref_type,
          wl.ref_id                  AS ref_id,
          wl.note                    AS note,
          wl.created_at              AS created_at,
          m.nickname                 AS member_nickname,
          m.short_id                 AS member_short_id
        FROM wallet_ledger wl
        JOIN members m ON m.id = wl.member_id

        UNION ALL

        -- 2) deposits (fallback)
        SELECT
          ('D' || d.id)::text        AS id,
          'deposit'                  AS type,
          'credit'                   AS direction,
          d.amount                   AS amount,
          'deposit'                  AS ref_type,
          d.id                       AS ref_id,
          d.status                   AS note,
          d.created_at               AS created_at,
          m.nickname                 AS member_nickname,
          m.short_id                 AS member_short_id
        FROM deposits d
        JOIN members m ON m.id = d.member_id

        UNION ALL

        -- 3) withdrawals (fallback)
        SELECT
          ('W' || w.id)::text        AS id,
          'withdraw'                 AS type,
          'debit'                    AS direction,
          w.amount                   AS amount,
          'withdrawal'               AS ref_type,
          w.id                       AS ref_id,
          w.status                   AS note,
          w.created_at               AS created_at,
          m.nickname                 AS member_nickname,
          m.short_id                 AS member_short_id
        FROM withdrawals w
        JOIN members m ON m.id = w.member_id
      ) x
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to load recent transactions" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword)
    return res.status(400).json({ message: "Email and password required" });

  const hash = await bcrypt.hash(newPassword, 10);

  const r = await pool.query(
    `
    UPDATE users
    SET password=$1
    WHERE email=$2
      AND role IN ('owner','agent')
    RETURNING id
    `,
    [hash, email]
  );

  if (!r.rowCount)
    return res.status(404).json({ message: "User not found" });

  res.json({ message: "Password updated" });
});

// Block a user
router.post("/:id/block", auth, allowRoles("admin", "owner"), async (req, res) => {
  const id = Number(req.params.id);

  try {
    // ✅ Owner can block any agent
    if (req.user.role === "owner") {
      const r = await pool.query(
        `UPDATE users
         SET is_blocked = true
         WHERE id = $1
           AND role = 'agent'
         RETURNING id, short_id, name, email, role, is_blocked, created_by`,
        [id]
      );
      if (!r.rowCount) return res.status(404).json({ message: "User not found / not allowed" });
      return res.json(r.rows[0]);
    }

    // ✅ Admin can block anyone except admin (optional safety)
    const r = await pool.query(
      `UPDATE users
       SET is_blocked = true
       WHERE id = $1
         AND role <> 'admin'
       RETURNING id, short_id, name, email, role, is_blocked, created_by`,
      [id]
    );

    if (!r.rowCount) return res.status(404).json({ message: "User not found / not allowed" });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to block user" });
  }
});

// Unblock a user
router.post("/:id/unblock", auth, allowRoles("admin", "owner"), async (req, res) => {
  const id = Number(req.params.id);

  try {
    // ✅ Owner can unblock any agent
    if (req.user.role === "owner") {
      const r = await pool.query(
        `UPDATE users
         SET is_blocked = false
         WHERE id = $1
           AND role = 'agent'
         RETURNING id, short_id, name, email, role, is_blocked, created_by`,
        [id]
      );
      if (!r.rowCount) return res.status(404).json({ message: "User not found / not allowed" });
      return res.json(r.rows[0]);
    }

    // ✅ Admin can unblock anyone except admin (optional safety)
    const r = await pool.query(
      `UPDATE users
       SET is_blocked = false
       WHERE id = $1
         AND role <> 'admin'
       RETURNING id, short_id, name, email, role, is_blocked, created_by`,
      [id]
    );

    if (!r.rowCount) return res.status(404).json({ message: "User not found / not allowed" });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to unblock user" });
  }
});

export default router;
