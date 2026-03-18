// server/index.js (or app.js)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route modules
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import membersRoutes from "./routes/members.js";  // ✅ ADD THIS
import depositsRoutes from "./routes/deposits.js";

dotenv.config();

const app = express();

// ✅ Fix CORS: remove trailing spaces in URL
app.use(cors({
  origin: ["http://localhost:5173", "https://goldmiracle.bond"],  // ✅ Trimmed
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/members", membersRoutes);  // ✅ ADD THIS LINE
app.use("/deposits", depositsRoutes); 

const PORT = process.env.PORT || 5040;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));