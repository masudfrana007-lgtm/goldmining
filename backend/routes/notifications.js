import express from "express";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js"; // ✅ Use existing auth middleware

const router = express.Router();

/**
 * Helper: Inline admin role check
 * Replaces the missing adminAuth middleware
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

/**
 * GET /admin/notifications/count
 * Returns unread count for badge
 */
router.get("/count", auth, requireAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int as unread FROM admin_notifications WHERE is_read = false`
    );
    res.json({ unread: r.rows[0]?.unread || 0 });
  } catch (e) {
    console.error("Notification count error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /admin/notifications
 * Returns list of notifications (unread first), with request details
 * Query params: ?filter=unread|all&limit=50
 */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const filter = req.query.filter === 'unread' ? 'AND n.is_read = false' : '';
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const r = await pool.query(
      `
      SELECT 
        n.id as notif_id,
        n.type,
        n.is_read,
        n.created_at as notif_created_at,
        
        -- Deposit details (if type='deposit')
        d.id as deposit_id,
        d.amount as deposit_amount,
        d.method as deposit_method,
        d.asset,
        d.network,
        d.status as deposit_status,
        
        -- Withdrawal details (if type='withdrawal')
        w.id as withdrawal_id,
        w.amount as withdrawal_amount,
        w.method as withdrawal_method,
        w.account_details,
        w.status as withdrawal_status,
        
        -- Member info (common)
        m.short_id as member_short_id,
        m.nickname,
        m.phone,
        m.email

      FROM admin_notifications n
      JOIN members m ON m.id = n.member_id
      LEFT JOIN deposits d ON d.id = n.ref_id AND n.type = 'deposit'
      LEFT JOIN withdrawals w ON w.id = n.ref_id AND n.type = 'withdrawal'
      WHERE true ${filter}
      ORDER BY n.is_read ASC, n.created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    // Transform rows to cleaner shape
    const notifications = r.rows.map(row => ({
      id: row.notif_id,
      type: row.type,
      is_read: row.is_read,
      created_at: row.notif_created_at,
      member: {
        short_id: row.member_short_id,
        nickname: row.nickname,
        phone: row.phone,
        email: row.email
      },
      request: row.type === 'deposit' ? {
        id: row.deposit_id,
        amount: row.deposit_amount,
        method: row.deposit_method,
        asset: row.asset,
        network: row.network,
        status: row.deposit_status
      } : {
        id: row.withdrawal_id,
        amount: row.withdrawal_amount,
        method: row.withdrawal_method,
        account_details: row.account_details,
        status: row.withdrawal_status
      }
    }));

    res.json(notifications);
  } catch (e) {
    console.error("Notification list error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /admin/notifications/:id/read
 * Mark a notification as read
 */
router.post("/:id/read", auth, requireAdmin, async (req, res) => {
  try {
    const notifId = parseInt(req.params.id);
    
    const r = await pool.query(
      `
      UPDATE admin_notifications 
      SET is_read = true, read_at = now()
      WHERE id = $1 AND is_read = false
      RETURNING id
      `,
      [notifId]
    );

    if (r.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found or already read" });
    }

    res.json({ success: true, id: notifId });
  } catch (e) {
    console.error("Mark as read error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /admin/notifications/read-all
 * Mark all notifications as read (optional convenience)
 */
router.post("/read-all", auth, requireAdmin, async (req, res) => {
  try {
    await pool.query(
      `UPDATE admin_notifications SET is_read = true, read_at = now() WHERE is_read = false`
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Mark all read error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;