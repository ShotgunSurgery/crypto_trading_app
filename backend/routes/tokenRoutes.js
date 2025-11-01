import express from "express";
import { getAllTokens, updateTokenPrice, getTokenSummary } from "../controllers/tokenController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected - require JWT authentication
router.get("/", verifyToken, getAllTokens);
router.put("/update-price/:id", verifyToken, updateTokenPrice);
router.get("/summary", verifyToken, getTokenSummary);

export default router;

