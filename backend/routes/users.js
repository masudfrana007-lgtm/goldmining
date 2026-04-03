import express from "express";
import { pool } from "../db.js";
import { memberAuth } from "../middleware/memberAuth.js";

const router = express.Router();

/**
 * GET /member/me
 * Returns logged in member profile + wallet balance
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

/**
 * PATCH /member/me
 * Member edits own email only
 */
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
    if (msg.includes("members_email_key")) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /member/deposits
 * Create deposit request
 */
router.post("/deposits", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;
    const amount = Number(req.body.amount || 0);
    const method = String(req.body.method || "").trim();
    const asset = String(req.body.asset || "USDT").trim();
    const network = String(req.body.network || "").trim();
    const tx_ref_raw = (req.body.tx_ref ?? "").toString().trim();
    const proof_url = String(req.body.proof_url || "").trim();

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (!method) return res.status(400).json({ message: "Method required" });
    if (method.toLowerCase().includes("crypto") && !network) {
      return res.status(400).json({ message: "Network required for crypto deposit" });
    }

    const m = await pool.query(`SELECT approval_status FROM members WHERE id=$1`, [memberId]);
    if (!m.rowCount) return res.status(404).json({ message: "Member not found" });
    if (m.rows[0].approval_status !== "approved") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    const r = await pool.query(
      tx_ref_raw
        ? `INSERT INTO deposits (member_id, amount, method, asset, network, tx_ref, proof_url, source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'member') RETURNING *`
        : `INSERT INTO deposits (member_id, amount, method, asset, network, proof_url, source)
           VALUES ($1,$2,$3,$4,$5,$6,'member') RETURNING *`,
      tx_ref_raw
        ? [memberId, amount, method, asset, network || null, tx_ref_raw, proof_url || null]
        : [memberId, amount, method, asset, network || null, proof_url || null]
    );

    // Create admin notification
    await pool.query(
      `INSERT INTO admin_notifications (type, ref_id, member_id)
       VALUES ('deposit', $1, $2)
       ON CONFLICT (type, ref_id) DO NOTHING`,
      [r.rows[0].id, memberId]
    );

    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /member/deposits
 * List my deposits
 */
router.get("/deposits", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;
    const r = await pool.query(
      `SELECT id, amount, method, asset, network, tx_ref, proof_url, source, status, admin_note, created_at, reviewed_at
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

/**
 * POST /member/withdrawals
 * Create withdrawal request (locks money immediately)
 */
router.post("/withdrawals", memberAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const memberId = req.member.member_id;
    const amount = Number(req.body.amount || 0);
    const methodRaw = String(req.body.method || "").trim();
    const method = methodRaw.toLowerCase();
    const asset = String(req.body.asset || "").trim();
    const network = String(req.body.network || "").trim();
    const wallet_address = String(req.body.wallet_address || "").trim();
    const bank_country = String(req.body.bank_country || "").trim();
    const bank_name = String(req.body.bank_name || "").trim();
    const account_holder_name = String(req.body.account_holder_name || "").trim();
    const account_number = String(req.body.account_number || "").trim();
    const routing_number = String(req.body.routing_number || "").trim();
    const branch_name = String(req.body.branch_name || "").trim();

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (!method) return res.status(400).json({ message: "Method required" });
    
    const isCrypto = method === "crypto";
    const isBank = method === "bank";
    if (!isCrypto && !isBank) return res.status(400).json({ message: "Method must be crypto or bank" });
    
    if (isCrypto && (!asset || !network || !wallet_address)) {
      return res.status(400).json({ message: "Crypto fields required: asset, network, wallet_address" });
    }
    if (isBank && (!bank_country || !bank_name || !account_holder_name || !account_number)) {
      return res.status(400).json({ message: "Bank fields required: country, name, holder, account_number" });
    }

    const account_details = isCrypto
      ? `${asset} ${network} → ${wallet_address}`
      : `${bank_name} (${bank_country}) • ${account_holder_name} • ${account_number}`;

    const m = await pool.query(`SELECT approval_status, withdraw_privilege FROM members WHERE id=$1`, [memberId]);
    if (!m.rowCount) return res.status(404).json({ message: "Member not found" });
    if (m.rows[0].approval_status !== "approved") return res.status(403).json({ message: "Account not approved yet" });
    if (!m.rows[0].withdraw_privilege) return res.status(403).json({ message: "Withdraw not allowed" });

    await client.query("BEGIN");
    
    // Ensure wallet exists
    await client.query(`INSERT INTO wallets(member_id) VALUES($1) ON CONFLICT (member_id) DO NOTHING`, [memberId]);

    // Check balance with row lock
    const w = await client.query(`SELECT balance, locked_balance FROM wallets WHERE member_id=$1 FOR UPDATE`, [memberId]);
    const bal = Number(w.rows[0]?.balance || 0);
    if (bal < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Lock the amount
    await client.query(
      `UPDATE wallets 
       SET balance = balance - $1, 
           locked_balance = locked_balance + $1, 
           updated_at = now() 
       WHERE member_id = $2`,
      [amount, memberId]
    );

    // Insert withdrawal request
    const wd = await client.query(
      `INSERT INTO withdrawals (
         member_id, amount, method, account_details, 
         asset, network, wallet_address, 
         bank_country, bank_name, account_holder_name, account_number, routing_number, branch_name
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
       RETURNING *`,
      [
        memberId, amount, method, account_details,
        isCrypto ? asset : null, isCrypto ? network : null, isCrypto ? wallet_address : null,
        isBank ? bank_country : null, isBank ? bank_name : null, isBank ? account_holder_name : null, 
        isBank ? account_number : null, isBank ? (routing_number || null) : null, isBank ? (branch_name || null) : null
      ]
    );

    // Create admin notification
    await client.query(
      `INSERT INTO admin_notifications (type, ref_id, member_id) 
       VALUES ('withdrawal', $1, $2) 
       ON CONFLICT (type, ref_id) DO NOTHING`,
      [wd.rows[0].id, memberId]
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

/**
 * GET /member/withdrawals
 * List my withdrawals
 */
router.get("/withdrawals", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;
    const r = await pool.query(
      `SELECT id, amount, method, tx_ref, status, account_details, 
              asset, network, wallet_address, 
              bank_country, bank_name, account_holder_name, account_number, 
              routing_number, branch_name, 
              created_at, reviewed_at
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

export default router;