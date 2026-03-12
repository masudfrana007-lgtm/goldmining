import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { loginSchema } from "../validators.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  // ✅ Include is_blocked in SELECT
  const r = await pool.query(
    "SELECT id, short_id, name, email, password, role, is_blocked FROM users WHERE email = $1",
    [email]
  );

  const user = r.rows[0];
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  // ✅ Check if user is blocked
  if (user.is_blocked) {
    return res.status(403).json({ message: "Account is blocked by owner" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      short_id: user.short_id,
      role: user.role,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      short_id: user.short_id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export default router;
