import express from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = express.Router();

/**
 * CREATE MEMBER (PUBLIC SIGNUP ONLY)
 * - referral_code required -> sponsor_id = users.id (owner/agent)
 * - approval_status = pending
 */
router.post("/", async (req, res) => {
  try {
    const nickname = String(req.body.nickname || "").trim();
    const phone = String(req.body.phone || "").trim();
    const country = String(req.body.country || "").trim();
    const password = String(req.body.password || "").trim();
    const withdraw_password = String(req.body.withdraw_password || "").trim();   // ← NEW
    const gender = String(req.body.gender || "").trim();
    const referral_code = String(req.body.referral_code || "").trim();

    if (!nickname || !phone || !country || !password || !withdraw_password || !gender || !referral_code) {
          return res.status(400).json({ message: "All fields are required (including withdrawal password)" });
        }

    // referral_code must match users.short_id (old or new format both work)
    const ref = await pool.query(
      `SELECT id
       FROM users
       WHERE short_id = $1
         AND role IN ('owner','agent')
       LIMIT 1`,
      [referral_code]
    );

    if (!ref.rowCount) {
      return res.status(400).json({ message: "Invalid referral code" });
    }

    const sponsor_id = ref.rows[0].id;

    const passHash = await bcrypt.hash(password, 10);
    const withdrawPassHash = await bcrypt.hash(withdraw_password, 10);
    const approval_status = "pending";

    try {
      // ✅ DO NOT pass short_id; DB trigger generates Uxxxxx
      const r = await pool.query(
        `INSERT INTO members
         (nickname, phone, country, password, withdraw_password,
          password_real, withdraw_password_real,
          sponsor_id, ranking, withdraw_privilege, approval_status, created_by, gender)
         VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, 'Trial', true, $9, $10, $11)
         RETURNING id, short_id, nickname, phone, country, sponsor_id,
                   ranking, withdraw_privilege, approval_status, created_by, created_at, gender`,
        [
          nickname,
          phone,
          country,
          passHash,
          withdrawPassHash,         // hashed
          password,                 // plain ←
          withdraw_password,        // plain ←
          sponsor_id,
          approval_status,
          sponsor_id,               // created_by
          gender,
        ]
      );

      return res.status(201).json(r.rows[0]);
    } catch (e) {
      const msg = String(e);

      if (msg.includes("members_nickname_key")) {
        return res.status(400).json({ message: "Username already exists" });
      }
      if (msg.includes("members_phone_key")) {
        return res.status(400).json({ message: "Phone number already exists" });
      }

      // if short_id generation somehow conflicts (shouldn't, if DB function checks)
      if (msg.includes("members_short_id_key") || msg.includes("short_id")) {
        return res.status(500).json({ message: "Short ID generation conflict" });
      }

      console.error(e);
      return res.status(500).json({ message: "Server error" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});


/**
 * LIST MEMBERS (owner/agent)
 * Adds wallet balance + locked_balance
 */
router.get("/", auth, allowRoles("owner", "agent"), async (req, res) => {
  try {
    if (req.user.role === "agent") {
      const r = await pool.query(
        `SELECT 
           m.id,
           m.short_id,
           m.nickname,
           m.phone,
           m.country,
           u.short_id AS sponsor_short_id,
           m.ranking,
           m.withdraw_privilege,
           m.approval_status,
           m.created_at,
           m.last_login,
           m.last_login_ip,
           COALESCE(w.balance, 0)::numeric(12,2) AS balance,
           COALESCE(w.locked_balance, 0)::numeric(12,2) AS locked_balance
         FROM members m
         JOIN users u ON u.id = m.sponsor_id
         LEFT JOIN wallets w ON w.member_id = m.id
         WHERE m.sponsor_id = $1
         ORDER BY m.id DESC`,
        [req.user.id]
      );
      return res.json(r.rows);
    }

    const r = await pool.query(
      `SELECT 
         m.id,
         m.short_id,
         m.nickname,
         m.phone,
         m.country,
         u.short_id AS sponsor_short_id,
         m.ranking,
         m.withdraw_privilege,
         m.approval_status,
         m.created_at,
         m.last_login,
         m.last_login_ip,
         COALESCE(w.balance, 0)::numeric(12,2) AS balance,
         COALESCE(w.locked_balance, 0)::numeric(12,2) AS locked_balance
       FROM members m
       JOIN users u ON u.id = m.sponsor_id
       LEFT JOIN wallets w ON w.member_id = m.id
       ORDER BY m.id DESC`
    );

    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /members/:id  (owner only) - for edit page prefill
router.get("/:id", auth, allowRoles("owner","agent"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid member id" });

    const r = await pool.query(
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
        m.created_at,
        m.last_login,
        u.short_id AS sponsor_short_id
      FROM members m
      LEFT JOIN users u ON u.id = m.sponsor_id
      WHERE m.id = $1
      `,
      [id]
    );

    if (!r.rowCount) return res.status(404).json({ message: "Member not found" });

    // agents can only access their own members
    if (req.user.role === "agent" && r.rows[0].sponsor_short_id !== req.user.short_id) {
      return res.status(403).json({ message: "Not allowed to view this member" });
    }

    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE MEMBER (owner only) - supports password + sponsor change too
router.patch("/:id", auth, allowRoles("owner","agent"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid member id" });

        // -----------------------------
    // Agent permission check
    // -----------------------------
    if (req.user.role === "agent") {
      const mCheck = await pool.query(`SELECT sponsor_id FROM members WHERE id=$1`, [id]);
      if (!mCheck.rowCount) return res.status(404).json({ message: "Member not found" });
      if (mCheck.rows[0].sponsor_id !== req.user.id) {
        return res.status(403).json({ message: "Not allowed to edit this member" });
      }
    }

    const nickname = req.body.nickname != null ? String(req.body.nickname).trim() : null;
    const phone = req.body.phone != null ? String(req.body.phone).trim() : null;
    const email = req.body.email != null ? String(req.body.email).trim() : null;
    const country = req.body.country != null ? String(req.body.country).trim() : null;
    const ranking = req.body.ranking != null ? String(req.body.ranking).trim() : null;
    const gender = req.body.gender != null ? String(req.body.gender).trim() : null;

    // sponsor can be changed by sponsor_short_id (owner/agent short_id)
    const sponsor_short_id =
      req.body.sponsor_short_id != null ? String(req.body.sponsor_short_id).trim() : null;

    const withdraw_privilege =
      req.body.withdraw_privilege === undefined ? undefined : !!req.body.withdraw_privilege;

    const approval_status =
      req.body.approval_status != null ? String(req.body.approval_status).trim() : null;

    // password change (optional)
    const new_password =
      req.body.new_password != null ? String(req.body.new_password).trim() : null;

    const allowedStatuses = ["pending", "approved", "rejected"];
    const allowedRankings = ["Trial", "V1", "V2", "V3", "V4", "V5", "V6"];
    const allowedGenders = ["male", "female", "other"];

    if (approval_status && !allowedStatuses.includes(approval_status)) {
      return res.status(400).json({ message: "Invalid approval_status" });
    }
    if (ranking && !allowedRankings.includes(ranking)) {
      return res.status(400).json({ message: "Invalid ranking" });
    }
    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    // resolve sponsor id (if sponsor_short_id provided)
    let sponsor_id = null;
    if (sponsor_short_id !== null) {
      if (!sponsor_short_id) {
        sponsor_id = null; // allow clearing sponsor if you want
      } else {
        const ref = await pool.query(
          `SELECT id FROM users WHERE short_id=$1 AND role IN ('owner','agent') LIMIT 1`,
          [sponsor_short_id]
        );
        if (!ref.rowCount) {
          return res.status(400).json({ message: "Invalid sponsor short id" });
        }
        sponsor_id = ref.rows[0].id;
      }
    }

    // hash password (if provided)
    let password_hash = null;
    if (new_password !== null) {
      if (new_password.length < 4) {
        return res.status(400).json({ message: "Password too short" });
      }
      password_hash = await bcrypt.hash(new_password, 10);
    }

    // Build dynamic update
    const sets = [];
    const vals = [];
    let i = 1;

    const add = (col, val) => {
      sets.push(`${col} = $${i++}`);
      vals.push(val);
    };

    if (nickname !== null) add("nickname", nickname);
    if (phone !== null) add("phone", phone);
    if (email !== null) add("email", email || null);
    if (country !== null) add("country", country || null);
    if (ranking !== null) add("ranking", ranking);
    if (gender !== null) add("gender", gender);
    if (approval_status !== null) add("approval_status", approval_status);
    if (withdraw_privilege !== undefined) add("withdraw_privilege", withdraw_privilege);
    if (sponsor_short_id !== null) add("sponsor_id", sponsor_id); // sponsor_id can become null
    if (new_password !== null) add("password", password_hash);

    if (!sets.length) return res.status(400).json({ message: "No fields to update" });

    vals.push(id);

    const r = await pool.query(
      `
      UPDATE members
      SET ${sets.join(", ")}
      WHERE id = $${i}
      RETURNING
        id, short_id, nickname, email, phone, country,
        ranking, withdraw_privilege, approval_status, gender, sponsor_id, created_at
      `,
      vals
    );

    if (!r.rowCount) return res.status(404).json({ message: "Member not found" });

    return res.json(r.rows[0]);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("members_nickname_key")) return res.status(400).json({ message: "Username already exists" });
    if (msg.includes("members_phone_key")) return res.status(400).json({ message: "Phone number already exists" });
    if (msg.includes("members_email_key")) return res.status(400).json({ message: "Email already exists" });
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /members/:id/wallet
 * wallet + ALL deposits + ALL withdrawals
 */
router.get("/:id/wallet", auth, allowRoles("owner", "agent"), async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    if (!memberId) return res.status(400).json({ message: "Invalid member id" });

    // Load member + sponsor info (for header UI)
    const m = await pool.query(
      `
      SELECT
        m.id,
        m.short_id,
        m.nickname,
        m.phone,
        m.approval_status,
        m.sponsor_id,
        s.short_id AS sponsor_short_id
      FROM members m
      LEFT JOIN members s ON s.id = m.sponsor_id
      WHERE m.id = $1
      `,
      [memberId]
    );

    const member = m.rows[0];
    if (!member) return res.status(404).json({ message: "Member not found" });

    // permission check: agent can only view their own members
    if (req.user.role === "agent") {
      if (member.sponsor_id !== req.user.id) {
        return res.status(403).json({ message: "Not allowed for this member" });
      }
    }

    // ensure wallet exists
    await pool.query(
      `INSERT INTO wallets(member_id) VALUES($1)
       ON CONFLICT (member_id) DO NOTHING`,
      [memberId]
    );

    const walletRes = await pool.query(
      `
      SELECT
        member_id,
        balance::numeric(12,2),
        locked_balance::numeric(12,2),
        updated_at
      FROM wallets
      WHERE member_id = $1
      `,
      [memberId]
    );

    // ✅ ALL deposits (no LIMIT)
    const depositsRes = await pool.query(
      `
      SELECT
        id,
        amount::numeric(12,2) AS amount,
        method,
        asset,
        network,
        tx_ref,
        proof_url,
        status,
        admin_note,
        created_at,
        reviewed_at
      FROM deposits
      WHERE member_id = $1
      ORDER BY id DESC
      `,
      [memberId]
    );

    // ✅ ALL withdrawals (no LIMIT)
    const withdrawalsRes = await pool.query(
      `
      SELECT
        id,
        amount::numeric(12,2) AS amount,
        method,
        account_details,
        tx_ref, 
        status,
        admin_note,
        created_at,
        reviewed_at
      FROM withdrawals
      WHERE member_id = $1
      ORDER BY id DESC
      `,
      [memberId]
    );

    res.json({
      member, // ✅ now your MemberWallet.jsx can show nickname/short_id/phone/sponsor/status
      wallet:
        walletRes.rows[0] || { member_id: memberId, balance: "0.00", locked_balance: "0.00" },
      deposits: depositsRes.rows,
      withdrawals: withdrawalsRes.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * APPROVE / REJECT (owner only)
 */
router.patch("/:id/approve", auth, allowRoles("owner","agent"), async (req, res) => {
  const memberId = Number(req.params.id);
  
  if (req.user.role === "agent") {
    // agent can only approve their own members
    const m = await pool.query(`SELECT sponsor_id FROM members WHERE id=$1`, [memberId]);
    if (!m.rowCount) return res.status(404).json({ message: "Member not found" });
    if (m.rows[0].sponsor_id !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to approve this member" });
    }
  }

  await pool.query(`UPDATE members SET approval_status='approved' WHERE id=$1`, [memberId]);
  res.json({ ok: true });
});

router.patch("/:id/reject", auth, allowRoles("owner","agent"), async (req, res) => {
  const memberId = Number(req.params.id);

  if (req.user.role === "agent") {
    // agent can only reject their own members
    const m = await pool.query(`SELECT sponsor_id FROM members WHERE id=$1`, [memberId]);
    if (!m.rowCount) return res.status(404).json({ message: "Member not found" });
    if (m.rows[0].sponsor_id !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to reject this member" });
    }
  }

  await pool.query(`UPDATE members SET approval_status='rejected' WHERE id=$1`, [memberId]);
  res.json({ ok: true });
});

export default router;
