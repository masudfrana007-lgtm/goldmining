import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { memberAuth } from "../middleware/memberAuth.js";

const router = express.Router();

/* ---------------- helpers ---------------- */

const ALLOWED_RANKS = new Set(["V1", "V2", "V3"]);

function normUpper(v) {
  return String(v ?? "").trim().toUpperCase();
}
function normText(v) {
  return String(v ?? "").trim();
}
function safeRank(v) {
  const r = normUpper(v);
  return ALLOWED_RANKS.has(r) ? r : null;
}
function safeRankOrDefault(v) {
  return safeRank(v) || "V1";
}

/* ---------------- PHOTO UPLOAD (ADMIN) ---------------- */

// folder: /uploads/vip-wallets
const uploadsDir = path.join(process.cwd(), "uploads", "vip-wallets");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || "") || ".jpg").toLowerCase();
    const rank = safeRankOrDefault(req.body.vip_rank);
    cb(null, `vip_${rank}_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * UPLOAD PHOTO (owner/admin)
 * POST /vip-deposit-addresses/photo
 * form-data: photo=<file>, vip_rank=V1|V2|V3
 */
router.post(
  "/photo",
  auth,
  allowRoles("owner", "admin"),
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const vip_rank = safeRankOrDefault(req.body.vip_rank);
      const photo_url = `/uploads/vip-wallets/${req.file.filename}`;

      res.json({ vip_rank, photo_url });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* ---------------- DB CRUD ---------------- */

/**
 * ADMIN LIST (owner/admin)
 * GET /vip-deposit-addresses
 */
router.get("/", auth, allowRoles("owner", "admin"), async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT *
      FROM vip_deposit_addresses
      ORDER BY vip_rank, upper(asset), COALESCE(upper(network),'')
      `
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ADMIN UPSERT (owner/admin)
 * POST /vip-deposit-addresses/upsert
 * body: { vip_rank, asset, network, wallet_address, photo_url, is_active }
 */
router.post("/upsert", auth, allowRoles("owner", "admin"), async (req, res) => {
  try {
    const vip_rank = safeRank(req.body.vip_rank);
    const asset = normUpper(req.body.asset);
    const networkRaw = normUpper(req.body.network);
    const network = networkRaw ? networkRaw : null;

    const wallet_address = normText(req.body.wallet_address);
    const photo_url = normText(req.body.photo_url) || null;
    const is_active = req.body.is_active === false ? false : true;

    if (!vip_rank) return res.status(400).json({ message: "Invalid vip_rank" });
    if (!asset) return res.status(400).json({ message: "asset required" });
    if (!wallet_address) return res.status(400).json({ message: "wallet_address required" });

    const q = `
      INSERT INTO vip_deposit_addresses
        (vip_rank, asset, network, wallet_address, photo_url, is_active, created_by)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (vip_rank, upper(asset), COALESCE(upper(network),''))
      DO UPDATE SET
        wallet_address = EXCLUDED.wallet_address,
        photo_url = EXCLUDED.photo_url,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING *
    `;

    const r = await pool.query(q, [
      vip_rank,
      asset,
      network,
      wallet_address,
      photo_url,
      is_active,
      req.user.id,
    ]);

    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ADMIN DELETE slot (optional)
 * DELETE /vip-deposit-addresses/slot?vip_rank=V1&asset=USDT&network=TRC20
 */
router.delete("/slot", auth, allowRoles("owner", "admin"), async (req, res) => {
  try {
    const vip_rank = safeRank(req.query.vip_rank);
    const asset = normUpper(req.query.asset);
    const networkRaw = normUpper(req.query.network);
    const network = networkRaw ? networkRaw : null;

    if (!vip_rank) return res.status(400).json({ message: "Invalid vip_rank" });
    if (!asset) return res.status(400).json({ message: "asset required" });

    const r = await pool.query(
      `
      DELETE FROM vip_deposit_addresses
      WHERE vip_rank = $1
        AND upper(asset) = upper($2)
        AND COALESCE(upper(network),'') = COALESCE(upper($3),'')
      RETURNING id
      `,
      [vip_rank, asset, network]
    );

    res.json({ ok: true, deleted: r.rowCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * MEMBER GET wallet for MY rank (member token)
 * GET /vip-deposit-addresses/me?asset=USDT&network=TRC20
 */
router.get("/me", memberAuth, async (req, res) => {
  try {
    const memberId = req.member.member_id;

    const asset = normUpper(req.query.asset || "USDT");
    const networkRaw = normUpper(req.query.network || "TRC20");
    const network = networkRaw ? networkRaw : null;

    const m = await pool.query(`SELECT ranking FROM members WHERE id=$1`, [memberId]);
    const ranking = normUpper(m.rows?.[0]?.ranking || "V1");
    const vip_rank = ALLOWED_RANKS.has(ranking) ? ranking : "V1";

    const r = await pool.query(
      `
      SELECT vip_rank, asset, network, wallet_address, photo_url
      FROM vip_deposit_addresses
      WHERE vip_rank=$1
        AND upper(asset)=upper($2)
        AND COALESCE(upper(network),'')=COALESCE(upper($3),'')
        AND is_active=true
      LIMIT 1
      `,
      [vip_rank, asset, network]
    );

    res.json(r.rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
