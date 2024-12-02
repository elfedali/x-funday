import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";

const router = Router();

router.post("/u/r", registerUser).post("/u/l", loginUser);

export default router;
