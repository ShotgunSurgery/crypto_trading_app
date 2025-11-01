import express from "express";
import { getUserTransactions } from "../controllers/transactionHistoryController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route - requires JWT authentication
router.get("/", verifyToken, getUserTransactions);

export default router;

