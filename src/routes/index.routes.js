import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getAllUsers } from "../models/user.model.js";

const router = Router();

router.get("/", isAuthenticated, async (req, res) => {
  const user = req.user;
  const users = await getAllUsers();
  res.render("index", {
    current_user: user,
    users: users,
    layout: "layouts/default",
    title: "chat",
  });
});

export default router;
