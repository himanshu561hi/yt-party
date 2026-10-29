import { Router } from "express";
import { signup, login, getCurrentUser, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", logout);

export default router;

