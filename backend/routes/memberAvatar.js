import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../db.js";
import { memberAuth } from "../middleware/memberAuth.js";

const router = express.Router();

// folder: /uploads/avatars
const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || "") || ".jpg").toLowerCase();
    cb(null, `m_${req.member.member_id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /member/avatar
router.post("/avatar", memberAuth, upload.single("avatar"), async (req, res) => {
  try {
    const memberId = req.member.member_id;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // saved URL (served statically by server)
    const avatar_url = `/uploads/avatars/${req.file.filename}`;

    const r = await pool.query(
      `
      UPDATE members
      SET avatar_url = $1
      WHERE id = $2
      RETURNING id, short_id, nickname, email, avatar_url
      `,
      [avatar_url, memberId]
    );

    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
