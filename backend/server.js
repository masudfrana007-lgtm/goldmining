// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route modules
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import membersRoutes from "./routes/members.js";
import depositsRoutes from "./routes/deposits.js";
import withdrawalsRoutes from "./routes/withdrawals.js"; 
import adminNotifications from "./routes/notifications.js";

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = ["http://localhost:5173", "https://goldmiracle.bond", "https://www.goldmiracle.bond"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow REST clients like Postman
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/members", membersRoutes);        // Member-facing routes (deposits, withdrawals, etc.)
app.use("/deposits", depositsRoutes);      // Admin deposit management
app.use("/withdrawals", withdrawalsRoutes); // ✅ ADD: Admin withdrawal management
app.use("/notifications", adminNotifications); // Admin notifications (badge + list)

const PORT = process.env.PORT || 5040;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});