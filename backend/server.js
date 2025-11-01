import 'dotenv/config';

import express from "express";
import cors from "cors";
import { createConnection } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
import transactionHistoryRoutes from "./routes/transactionHistoryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/transactions", transactionHistoryRoutes);

createConnection();

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});