import express from "express";
import { pool } from "../db.js";
import { memberAuth } from "../middleware/memberAuth.js";
import bcrypt from "bcrypt";

const router = express.Router();

function clean(v) {
  return String(v ?? "").trim();
}

function bad(res, message) {
  return res.status(400).json({ message });
}

/**
 * GET /member/beneficiaries?type=crypto|bank
 */
router.get("/", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;
    const type = clean(req.query.type).toLowerCase();

    const params = [memberId];
    let where = "WHERE member_id=$1";
    if (type) {
      if (!["crypto", "bank"].includes(type)) return bad(res, "Invalid type");
      params.push(type);
      where += ` AND type=$${params.length}`;
    }

    const r = await pool.query(
      `
      SELECT *
      FROM beneficiaries
      ${where}
      ORDER BY is_default DESC, id DESC
      `,
      params
    );

    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /member/beneficiaries
 */
router.post("/", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const type = clean(req.body.type).toLowerCase();
    const label = clean(req.body.label);
    const is_default = !!req.body.is_default;
    const note = clean(req.body.note) || null;
    const withdraw_password = clean(req.body.withdraw_password);

    if (!["crypto", "bank"].includes(type)) return bad(res, "Type must be crypto or bank");
    if (!label) return bad(res, "Label required");

    // ✅ check member withdrawal password exists
    const memberRes = await pool.query(
      `SELECT withdraw_password FROM members WHERE id=$1 LIMIT 1`,
      [memberId]
    );

    if (!memberRes.rowCount) {
      return res.status(404).json({ message: "Member not found" });
    }

    const savedWithdrawPassword = memberRes.rows[0].withdraw_password;

    if (!savedWithdrawPassword || !String(savedWithdrawPassword).trim()) {
      return res.status(400).json({
        message:
          "You do not have any withdraw password. Please contact support to add withdraw password first.",
      });
    }

    if (!withdraw_password) {
      return res.status(400).json({ message: "Withdraw password is required" });
    }

    const matched = await bcrypt.compare(withdraw_password, savedWithdrawPassword);
    if (!matched) {
      return res.status(400).json({ message: "Invalid withdraw password" });
    }

    // crypto
    const asset = clean(req.body.asset);
    const network = clean(req.body.network);
    const wallet_address = clean(req.body.wallet_address);

    // bank
    const bank_country = clean(req.body.bank_country);
    const bank_name = clean(req.body.bank_name);
    const account_holder_name = clean(req.body.account_holder_name);
    const account_number = clean(req.body.account_number);
    const routing_number = clean(req.body.routing_number) || null;
    const branch_name = clean(req.body.branch_name) || null;
    const swift = clean(req.body.swift) || null;

    if (type === "crypto") {
      if (!asset) return bad(res, "Asset required");
      if (!network) return bad(res, "Network required");
      if (!wallet_address) return bad(res, "Wallet address required");
    }

    if (type === "bank") {
      if (!bank_country) return bad(res, "Bank country required");
      if (!bank_name) return bad(res, "Bank name required");
      if (!account_holder_name) return bad(res, "Account holder name required");
      if (!account_number) return bad(res, "Account number required");
    }

    if (is_default) {
      await pool.query(
        `UPDATE beneficiaries SET is_default=false WHERE member_id=$1 AND type=$2`,
        [memberId, type]
      );
    }

    const r = await pool.query(
      `
      INSERT INTO beneficiaries (
        member_id, type, label, is_default,
        asset, network, wallet_address,
        bank_country, bank_name, account_holder_name, account_number, routing_number, branch_name, swift,
        note
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14,
        $15
      )
      RETURNING *
      `,
      [
        memberId, type, label, is_default,
        type === "crypto" ? asset : null,
        type === "crypto" ? network : null,
        type === "crypto" ? wallet_address : null,

        type === "bank" ? bank_country : null,
        type === "bank" ? bank_name : null,
        type === "bank" ? account_holder_name : null,
        type === "bank" ? account_number : null,
        type === "bank" ? routing_number : null,
        type === "bank" ? branch_name : null,
        type === "bank" ? swift : null,

        note,
      ]
    );

    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PATCH /member/beneficiaries/:id
 */
router.patch("/:id", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return bad(res, "Invalid id");

    const found = await pool.query(
      `SELECT * FROM beneficiaries WHERE id=$1 AND member_id=$2`,
      [id, memberId]
    );
    if (!found.rowCount) return res.status(404).json({ message: "Not found" });

    const prev = found.rows[0];
    const type = prev.type;

    const label = clean(req.body.label) || prev.label;
    const noteRaw = req.body.note;
    const note = noteRaw === undefined ? prev.note : (clean(noteRaw) || null);

    const is_default = req.body.is_default === undefined ? prev.is_default : !!req.body.is_default;

    if (is_default) {
      await pool.query(
        `UPDATE beneficiaries SET is_default=false WHERE member_id=$1 AND type=$2`,
        [memberId, type]
      );
    }

    const patch = {
      label,
      is_default,
      note,
      asset: prev.asset,
      network: prev.network,
      wallet_address: prev.wallet_address,
      bank_country: prev.bank_country,
      bank_name: prev.bank_name,
      account_holder_name: prev.account_holder_name,
      account_number: prev.account_number,
      routing_number: prev.routing_number,
      branch_name: prev.branch_name,
      swift: prev.swift,
    };

    if (type === "crypto") {
      patch.asset = clean(req.body.asset) || patch.asset;
      patch.network = clean(req.body.network) || patch.network;
      patch.wallet_address = clean(req.body.wallet_address) || patch.wallet_address;
      if (!patch.asset || !patch.network || !patch.wallet_address) return bad(res, "Missing crypto fields");
    } else {
      patch.bank_country = clean(req.body.bank_country) || patch.bank_country;
      patch.bank_name = clean(req.body.bank_name) || patch.bank_name;
      patch.account_holder_name = clean(req.body.account_holder_name) || patch.account_holder_name;
      patch.account_number = clean(req.body.account_number) || patch.account_number;
      patch.routing_number = clean(req.body.routing_number) || patch.routing_number;
      patch.branch_name = clean(req.body.branch_name) || patch.branch_name;
      patch.swift = clean(req.body.swift) || patch.swift;

      if (!patch.bank_country || !patch.bank_name || !patch.account_holder_name || !patch.account_number)
        return bad(res, "Missing bank fields");
    }

    const r = await pool.query(
      `
      UPDATE beneficiaries
      SET
        label=$1,
        is_default=$2,

        asset=$3, network=$4, wallet_address=$5,

        bank_country=$6, bank_name=$7, account_holder_name=$8, account_number=$9,
        routing_number=$10, branch_name=$11, swift=$12,

        note=$13,
        updated_at=now()
      WHERE id=$14 AND member_id=$15
      RETURNING *
      `,
      [
        patch.label,
        patch.is_default,

        patch.asset,
        patch.network,
        patch.wallet_address,

        patch.bank_country,
        patch.bank_name,
        patch.account_holder_name,
        patch.account_number,
        patch.routing_number || null,
        patch.branch_name || null,
        patch.swift || null,

        patch.note,
        id,
        memberId,
      ]
    );

    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /member/beneficiaries/:id
 */
router.delete("/:id", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;
    const id = Number(req.params.id);

    const r = await pool.query(
      `DELETE FROM beneficiaries WHERE id=$1 AND member_id=$2 RETURNING id, type, is_default`,
      [id, memberId]
    );
    if (!r.rowCount) return res.status(404).json({ message: "Not found" });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
