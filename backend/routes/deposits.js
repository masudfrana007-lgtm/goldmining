import express from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = express.Router();

/**
 * LIST deposits (owner only)
 */
router.get("/", auth, allowRoles("owner"), async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT d.*, m.nickname, m.phone, m.short_id AS member_short_id
      FROM deposits d
      JOIN members m ON m.id = d.member_id
      ORDER BY d.id DESC
      `
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE deposit request (owner only)
 * Creates a pending deposit for a member (does NOT change wallet yet).
 */
router.post("/", auth, allowRoles("owner", "agent"), async (req, res) => {
  try {
    const member_id = Number(req.body.member_id);
    const amount = Number(req.body.amount || 0);
    const method = String(req.body.method || "").trim();
    const tx_ref_raw = (req.body.tx_ref ?? "").toString().trim();
    const proof_url = String(req.body.proof_url || "").trim();
    const asset = String(req.body.asset || "USDT").trim();
    const network = String(req.body.network || "").trim();

    if (!member_id) return res.status(400).json({ message: "member_id required" });
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (!method) return res.status(400).json({ message: "Method required" });
    if (method.toLowerCase().includes("crypto") && !network) {
      return res.status(400).json({ message: "Network required for crypto deposit" });
    }

    // Ensure member exists (optional but recommended)
    const m = await pool.query(`SELECT id FROM members WHERE id=$1`, [member_id]);
    if (!m.rowCount) return res.status(404).json({ message: "Member not found" });

    const creatorRole = req.user.role; // "owner" or "agent"

    const r = await pool.query(
      tx_ref_raw
        ? `
          INSERT INTO deposits
            (member_id, amount, method, asset, network, tx_ref, proof_url, source, status)
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,'${creatorRole}','pending')
          RETURNING *
          `
        : `
          INSERT INTO deposits
            (member_id, amount, method, asset, network, proof_url, source, status)
          VALUES
            ($1,$2,$3,$4,$5,$6,'${creatorRole}','pending')
          RETURNING *
          `,
      tx_ref_raw
        ? [member_id, amount, method, asset, network || null, tx_ref_raw, proof_url || null]
        : [member_id, amount, method, asset, network || null, proof_url || null]
    );    

    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * APPROVE deposit (owner only)
 */
router.patch("/:id/approve", auth, allowRoles("owner"), async (req, res) => {
  const client = await pool.connect();
  try {
    const depId = Number(req.params.id);
    if (!depId) return res.status(400).json({ message: "Invalid deposit id" });

    await client.query("BEGIN");

    const depRes = await client.query(
      `SELECT * FROM deposits WHERE id=$1 FOR UPDATE`,
      [depId]
    );
    const d = depRes.rows[0];
    if (!d) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Deposit not found" });
    }
    if (d.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Deposit is not pending" });
    }

    const admin_note = String(req.body.admin_note || "").trim();

    await client.query(
      `UPDATE deposits
       SET status='approved', reviewed_by=$1, reviewed_at=now(), admin_note=$2
       WHERE id=$3`,
      [req.user.id, admin_note || null, depId]
    );

    await client.query(
      `INSERT INTO wallets(member_id) VALUES($1)
       ON CONFLICT (member_id) DO NOTHING`,
      [d.member_id]
    );

    const ins = await client.query(
      `
      INSERT INTO wallet_ledger (member_id, type, direction, amount, ref_type, ref_id, note)
      VALUES ($1,'deposit','credit',$2,'deposit',$3,'Deposit approved')
      ON CONFLICT (ref_type, ref_id) DO NOTHING
      RETURNING id
      `,
      [d.member_id, d.amount, d.id]
    );

    if (ins.rowCount > 0) {
      await client.query(
        `UPDATE wallets
         SET balance = balance + $1, updated_at = now()
         WHERE member_id = $2`,
        [d.amount, d.member_id]
      );
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

/**
 * REJECT deposit (owner only)
 */
router.patch("/:id/reject", auth, allowRoles("owner"), async (req, res) => {
  const client = await pool.connect();
  try {
    const depId = Number(req.params.id);
    if (!depId) return res.status(400).json({ message: "Invalid deposit id" });

    await client.query("BEGIN");

    const depRes = await client.query(
      `SELECT * FROM deposits WHERE id=$1 FOR UPDATE`,
      [depId]
    );
    const d = depRes.rows[0];
    if (!d) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Deposit not found" });
    }
    if (d.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Deposit is not pending" });
    }

    const admin_note = String(req.body.admin_note || "").trim();

    await client.query(
      `UPDATE deposits
       SET status='rejected', reviewed_by=$1, reviewed_at=now(), admin_note=$2
       WHERE id=$3`,
      [req.user.id, admin_note || null, depId]
    );

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

export default router;
