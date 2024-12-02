import { Router } from "express";
import { connectedUser } from "../controllers/user.controller.js";
import { hasAuthenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/u", hasAuthenticateToken, connectedUser);

export default router;
