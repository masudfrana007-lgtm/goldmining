import jwt from "jsonwebtoken";

export function memberAuth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.member_id) return res.status(401).json({ message: "Invalid token" });

    req.member = payload; // { member_id, sponsor_id }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
