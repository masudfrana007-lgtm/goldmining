// routes/support.js
import express from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = express.Router();
router.use(auth, allowRoles("admin", "owner", "agent"));

// ✅ agent inbox list
router.get("/inbox", async (req, res) => {
  const r = await pool.query(
    `
    SELECT
      c.id,
      c.member_id,
      c.status,
      c.assigned_agent_id,
      c.last_message_at,
      m.nickname AS member_name,
      m.phone AS member_phone,

      (SELECT COALESCE(sm.text, sm.file_name, '')
       FROM support_messages sm
       WHERE sm.conversation_id = c.id
       ORDER BY sm.created_at DESC, sm.id DESC
       LIMIT 1) AS last_message,

      (SELECT COUNT(*)
       FROM support_messages sm
       WHERE sm.conversation_id = c.id
         AND sm.sender_type = 'member'
         AND sm.read_by_agent = false) AS unread_count
    FROM support_conversations c
    JOIN members m ON m.id = c.member_id
    ORDER BY c.last_message_at DESC NULLS LAST, c.id DESC
    `
  );
  res.json(r.rows);
});

// ✅ get conversation messages (FIXED: include file_url + file_name)
router.get("/conversations/:id/messages", async (req, res) => {
  const conversationId = Number(req.params.id);
  if (!Number.isFinite(conversationId)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const r = await pool.query(
    `SELECT
        id,
        conversation_id,
        sender_type,
        kind,
        text,
        file_url,
        file_name,
        file_size,
        read_by_agent,
        read_by_member,
        created_at
     FROM support_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC, id ASC`,
    [conversationId]
  );

  res.json(r.rows);
});

// ✅ agent reply
router.post("/conversations/:id/reply", async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user?.id;
  const msg = String(req.body?.text || "").trim();

  if (!Number.isFinite(conversationId)) return res.status(400).json({ message: "Invalid id" });
  if (userId == null) return res.status(401).json({ message: "Unauthorized" });
  if (!msg) return res.status(400).json({ message: "Message is empty" });

  const ins = await pool.query(
    `INSERT INTO support_messages (
      conversation_id, sender_type, sender_user_id,
      kind, text, read_by_agent, read_by_member
    )
    VALUES ($1,'agent',$2,'text',$3,true,false)
    RETURNING *`,
    [conversationId, userId, msg]
  );

  await pool.query(
    `UPDATE support_conversations
     SET last_message_at = now(), status = 'pending'
     WHERE id = $1`,
    [conversationId]
  );

  res.status(201).json(ins.rows[0]);
});

// ✅ mark member messages read by agent (so unread_count becomes 0)
router.post("/conversations/:id/mark-read", async (req, res) => {
  const conversationId = Number(req.params.id);
  if (!Number.isFinite(conversationId)) return res.status(400).json({ message: "Invalid id" });

  await pool.query(
    `UPDATE support_messages
     SET read_by_agent = true
     WHERE conversation_id = $1 AND sender_type = 'member'`,
    [conversationId]
  );

  res.json({ ok: true });
});

export default router;
