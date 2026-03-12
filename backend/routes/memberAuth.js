import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

const router = express.Router();

/**
 * POST /member-auth/login
 * body: { identifier, password }
 */
router.post("/login", async (req, res) => {
  try {
    const identifier = String(req.body.identifier || "").trim();
    const password = String(req.body.password || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "identifier and password required" });
    }

    const r = await pool.query(
      `SELECT id, short_id, nickname, phone, password, sponsor_id, approval_status
       FROM members
       WHERE lower(nickname) = lower($1)
          OR phone = $1
       LIMIT 1`,
      [identifier]
    );

    const m = r.rows[0];
    if (!m) return res.status(401).json({ message: "Invalid credentials" });

    // optional: block if not approved
    if (m.approval_status !== "approved") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    const ok = await bcrypt.compare(password, m.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ capture IP (works with Cloudflare / proxy too)
    const ip =
      req.headers["cf-connecting-ip"] ||
      (req.headers["x-forwarded-for"]
        ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
        : null) ||
      req.ip ||
      null;

    // ✅ save last login + ip
    await pool.query(
      `UPDATE members
       SET last_login = now(),
           last_login_ip = $1
       WHERE id = $2`,
      [ip, m.id]
    );

    const token = jwt.sign(
      { member_id: m.id, sponsor_id: m.sponsor_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      member: {
        id: m.id,
        short_id: m.short_id,
        nickname: m.nickname,
        phone: m.phone,
        sponsor_id: m.sponsor_id,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
