import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5040;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));