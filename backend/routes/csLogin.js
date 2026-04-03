// routes/csLogin.js
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * POST /cs/login
 * body: { email, password }
 *
 * Returns: { token, user } same shape as /auth/login
 */
router.post("/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "").trim();

  if (email !== "cs@gmail.com" || password !== "cs123456") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // ✅ role must pass allowRoles("admin","owner","agent") on /support routes
  const user = {
    id: 0,                 // fake/system
    short_id: "CS-000",
    name: "Customer Support",
    email: "cs@gmail.com",
    role: "agent",
  };

  const token = jwt.sign(
    {
      id: user.id,
      short_id: user.short_id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({ token, user });
});

export default router;
