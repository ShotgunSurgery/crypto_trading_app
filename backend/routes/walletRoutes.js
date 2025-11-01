import express from "express";
import { getWallet, createWallet } from "../controllers/walletController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes - require authentication
router.get("/", verifyToken, getWallet);
router.post("/", verifyToken, createWallet);

export default router;

