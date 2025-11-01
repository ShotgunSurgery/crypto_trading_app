import express from "express";
import { buyToken, sellToken, getPortfolio } from "../controllers/tradeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes are protected - require JWT authentication
router.post("/buy", verifyToken, buyToken);
router.post("/sell", verifyToken, sellToken);
router.get("/portfolio", verifyToken, getPortfolio);

export default router;

