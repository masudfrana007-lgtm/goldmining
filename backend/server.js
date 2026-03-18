import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route modules
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";  // ← ADD THIS

dotenv.config();

const app = express();

// ✅ Update CORS to allow your production domain
app.use(cors({
  origin: ["http://localhost:5173", "https://goldmiracle.bond"],  // ← ADD production URL
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);  // ← ADD THIS LINE

const PORT = process.env.PORT || 5040;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));