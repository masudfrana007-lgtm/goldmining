import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = express.Router();

// ------------------
// Multer Config
// ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/tasks"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({ storage });

function safeUnlink(p) {
  try {
    fs.unlinkSync(p);
  } catch (_) {}
}

// ------------------
// Create Task (Owner)
// ------------------
router.post("/", auth, allowRoles("owner"), upload.single("image"), async (req, res) => {
  try {
    const { title, description, quantity, commission_rate, rate, task_type } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const type = String(task_type || "regular").toLowerCase();
    if (!["regular", "combo"].includes(type)) {
      return res.status(400).json({ message: "Invalid task type" });
    }

    const qty = Number(quantity || 1);
    const commission = Number(commission_rate || 0);
    const r = Number(rate || 0);

    const price = qty * r + (qty * r * commission) / 100;
    const imageUrl = req.file ? `/uploads/tasks/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO tasks 
        (title, description, image_url, quantity, commission_rate, rate, price, task_type, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)      
       RETURNING *`,
      [title, description || null, imageUrl, qty, commission, r, price, type, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------
// Get Tasks
// ------------------
// ------------------
// Get Tasks (ALL users: owner + agent can see ALL tasks)
// ------------------
router.get("/", auth, allowRoles("owner", "agent"), async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ------------------
// Update Task (Owner) - modal uses this
// ------------------
router.put("/:id", auth, allowRoles("owner"), upload.single("image"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid task id" });

    // ensure owner owns it
    const existing = await pool.query(
      "SELECT * FROM tasks WHERE id=$1 AND created_by=$2",
      [id, req.user.id]
    );
    const task = existing.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });

    const title = (req.body.title ?? task.title)?.trim();
    if (!title) return res.status(400).json({ message: "Title is required" });

    const description = req.body.description ?? task.description;

    const qty = Number(req.body.quantity ?? task.quantity ?? 1);
    const commission = Number(req.body.commission_rate ?? task.commission_rate ?? 0);
    const r = Number(req.body.rate ?? task.rate ?? 0);

    const price = qty * r + (qty * r * commission) / 100;

    let imageUrl = task.image_url;

    // replace image if new file uploaded
    if (req.file) {
      imageUrl = `/uploads/tasks/${req.file.filename}`;

      if (task.image_url) {
        const oldPath = path.join(process.cwd(), task.image_url.replace(/^\//, ""));
        safeUnlink(oldPath);
      }
    }

    const updated = await pool.query(
      `UPDATE tasks
         SET title=$1, description=$2, image_url=$3,
             quantity=$4, commission_rate=$5, rate=$6, price=$7
         WHERE id=$8 AND created_by=$9
         RETURNING *`,
      [title, description || null, imageUrl, qty, commission, r, price, id, req.user.id]
    );

    res.json(updated.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------
// Delete Task (Owner)
// ------------------
router.delete("/:id", auth, allowRoles("owner"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid task id" });

    const existing = await pool.query(
      "SELECT * FROM tasks WHERE id=$1 AND created_by=$2",
      [id, req.user.id]
    );
    const task = existing.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });

    await pool.query("DELETE FROM tasks WHERE id=$1 AND created_by=$2", [id, req.user.id]);

    if (task.image_url) {
      const imgPath = path.join(process.cwd(), task.image_url.replace(/^\//, ""));
      safeUnlink(imgPath);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------
// Duplicate Task (Owner)
// ------------------
router.post("/:id/duplicate", auth, allowRoles("owner"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid task id" });

    // must belong to owner
    const existing = await pool.query(
      "SELECT * FROM tasks WHERE id=$1 AND created_by=$2",
      [id, req.user.id]
    );

    const task = existing.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });

    const copy = await pool.query(
      `INSERT INTO tasks
        (title, description, image_url, quantity, commission_rate, rate, price, task_type, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        task.title,
        task.description,
        task.image_url,
        task.quantity,
        task.commission_rate,
        task.rate,
        task.price,
        task.task_type,
        req.user.id,
      ]
    );

    res.status(201).json(copy.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
