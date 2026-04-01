import { Router } from "express";
import { authRequired } from "../middlewares/validateToken.js";
import { 
    login,
    logout, 
    profile, 
    register, 
    verifyToke
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register)

router.post("/login", login)

router.post("/logout", logout)

router.get("/profile", authRequired, profile)

router.get("/verify-token", verifyToke)

export default router;