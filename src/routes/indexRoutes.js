import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

router.get("/", isAuthenticated, async (req, res) => {
  const user = req.user;
  res.render("index", { user });
});

export default router;
