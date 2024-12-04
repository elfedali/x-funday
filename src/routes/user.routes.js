import { Router } from "express";
import {
  actionGetConnectedUser,
  actionGetUser,
  actionUpdateUser,
  actionDeleteUser,
} from "../controllers/user.controller.js";
import { hasAuthenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .get("/u", hasAuthenticateToken, actionGetConnectedUser)
  .get("/u/:id", hasAuthenticateToken, actionGetUser)
  .put("/u/:id", hasAuthenticateToken, actionUpdateUser)
  .delete("/u/:id", hasAuthenticateToken, actionDeleteUser);

export default router;
