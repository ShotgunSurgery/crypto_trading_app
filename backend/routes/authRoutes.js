import express from "express";
import { signup, login } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes 
router.post("/signup",  signup);
router.post("/login",  login);
// Protected routes 
// router.get("/profile", verifyToken, (req, res) => {
//   res.json({ 
//     message: "Protected route accessed successfully",
//     user: req.user 
//   });
// });

// router.put("/update-profile", [verifyToken, validateProfile], (req, res) => {
// });

export default router;
