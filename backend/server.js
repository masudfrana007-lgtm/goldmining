import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import membersRoutes from "./routes/members.js";
import depositsRoutes from "./routes/deposits.js";
import withdrawalsRoutes from "./routes/withdrawals.js"; 
import adminNotifications from "./routes/notifications.js";
import vipRoutes from "./routes/vipDepositAddresses.js"; // ✅ ADD

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://goldmiracle.bond",
  "https://www.goldmiracle.bond"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅
  allowedHeaders: ["Content-Type", "Authorization"] // ✅
}));

app.options("*", cors()); // ✅ CRITICAL

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

// routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/members", membersRoutes);
app.use("/deposits", depositsRoutes);
app.use("/withdrawals", withdrawalsRoutes);
app.use("/notifications", adminNotifications);
app.use("/vip-deposit-addresses", vipRoutes); // ✅ ADD

const PORT = process.env.PORT || 5040;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});