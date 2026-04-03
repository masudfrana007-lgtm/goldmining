// routes/memberSupport.js
import express from "express";
import { pool } from "../db.js";
import { memberAuth } from "../middleware/memberAuth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

function getMemberId(req) {
  return (
    req.member?.member_id ||
    req.member?.id ||
    req.memberId ||
    req.user?.member_id ||
    req.user?.id ||
    null
  );
}

// ---------- upload setup ----------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// store: uploads/chats/member/<memberId>/<conversationId>/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const memberId = getMemberId(req);
    const conversationId = Number(req.body?.conversation_id);

    const dir = path.join(
      process.cwd(),
      "uploads",
      "chats",
      "member",
      String(memberId || "0"),
      String(Number.isFinite(conversationId) ? conversationId : "0")
    );
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : ".jpg";

    const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype || "");
  if (!ok) return cb(new Error("Only image files are allowed"), false);
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // ✅ 3MB
});

// ✅ create/get conversation
router.get("/conversation", memberAuth, async (req, res) => {
  const memberId = getMemberId(req);
  if (!memberId) return res.status(401).json({ message: "Unauthorized" });

  const ex = await pool.query(
    "SELECT * FROM support_conversations WHERE member_id = $1",
    [memberId]
  );
  if (ex.rows[0]) return res.json(ex.rows[0]);

  const created = await pool.query(
    `INSERT INTO support_conversations (member_id, status)
     VALUES ($1, 'open')
     RETURNING *`,
    [memberId]
  );
  res.json(created.rows[0]);
});

// ✅ list messages (✅ includes file_url + file_name + file_size)
router.get("/messages", memberAuth, async (req, res) => {
  const memberId = getMemberId(req);
  const conversationId = Number(req.query.conversation_id);

  if (!memberId) return res.status(401).json({ message: "Unauthorized" });
  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ message: "conversation_id required" });
  }

  const ok = await pool.query(
    "SELECT id FROM support_conversations WHERE id = $1 AND member_id = $2",
    [conversationId, memberId]
  );
  if (!ok.rows[0]) return res.status(403).json({ message: "Forbidden" });

  const r = await pool.query(
    `SELECT id, conversation_id, sender_type, kind, text,
            file_url, file_name, file_size,
            read_by_agent, read_by_member, created_at
     FROM support_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC, id ASC`,
    [conversationId]
  );

  res.json(r.rows);
});

// ✅ send text
router.post("/send", memberAuth, async (req, res) => {
  const memberId = getMemberId(req);
  const { conversation_id, text } = req.body || {};
  const conversationId = Number(conversation_id);

  if (!memberId) return res.status(401).json({ message: "Unauthorized" });
  if (!Number.isFinite(conversationId))
    return res.status(400).json({ message: "conversation_id required" });

  const msg = String(text || "").trim();
  if (!msg) return res.status(400).json({ message: "Message is empty" });

  const ok = await pool.query(
    "SELECT id FROM support_conversations WHERE id = $1 AND member_id = $2",
    [conversationId, memberId]
  );
  if (!ok.rows[0]) return res.status(403).json({ message: "Forbidden" });

  const ins = await pool.query(
    `INSERT INTO support_messages (
      conversation_id, sender_type, sender_member_id,
      kind, text, read_by_agent, read_by_member
    )
    VALUES ($1,'member',$2,'text',$3,false,true)
    RETURNING *`,
    [conversationId, memberId, msg]
  );

  await pool.query(
    `UPDATE support_conversations
     SET last_message_at = now(), status = 'open'
     WHERE id = $1`,
    [conversationId]
  );

  res.status(201).json(ins.rows[0]);
});

// ✅ send photo (multipart/form-data)
// ✅ stores public URL in file_url (matches DB schema)
router.post(
  "/send-photo",
  memberAuth,
  upload.single("photo"),
  async (req, res) => {
    const memberId = getMemberId(req);
    const conversationId = Number(req.body?.conversation_id);

    if (!memberId) return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isFinite(conversationId))
      return res.status(400).json({ message: "conversation_id required" });
    if (!req.file) return res.status(400).json({ message: "Photo is required" });

    const ok = await pool.query(
      "SELECT id FROM support_conversations WHERE id = $1 AND member_id = $2",
      [conversationId, memberId]
    );
    if (!ok.rows[0]) return res.status(403).json({ message: "Forbidden" });

    // ✅ public URL path
    const urlPath = `/uploads/chats/member/${memberId}/${conversationId}/${req.file.filename}`;

    const ins = await pool.query(
      `INSERT INTO support_messages (
        conversation_id, sender_type, sender_member_id,
        kind, text, file_url, file_name, file_size,
        read_by_agent, read_by_member
      )
      VALUES ($1,'member',$2,'photo',NULL,$3,$4,$5,false,true)
      RETURNING *`,
      [
        conversationId,
        memberId,
        urlPath,
        req.file.originalname || "",
        req.file.size || null,
      ]
    );

    await pool.query(
      `UPDATE support_conversations
       SET last_message_at = now(), status = 'open'
       WHERE id = $1`,
      [conversationId]
    );

    res.status(201).json(ins.rows[0]);
  }
);

// ✅ mark agent messages read by member
router.post("/mark-read", memberAuth, async (req, res) => {
  const memberId = getMemberId(req);
  const conversationId = Number(req.body?.conversation_id);

  if (!memberId) return res.status(401).json({ message: "Unauthorized" });
  if (!Number.isFinite(conversationId))
    return res.status(400).json({ message: "conversation_id required" });

  const ok = await pool.query(
    "SELECT id FROM support_conversations WHERE id = $1 AND member_id = $2",
    [conversationId, memberId]
  );
  if (!ok.rows[0]) return res.status(403).json({ message: "Forbidden" });

  await pool.query(
    `UPDATE support_messages
     SET read_by_member = true
     WHERE conversation_id = $1 AND sender_type = 'agent'`,
    [conversationId]
  );

  res.json({ ok: true });
});

export default router;
