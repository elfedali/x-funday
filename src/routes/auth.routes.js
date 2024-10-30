import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/auth.controller.js";

const router = Router();

router
  .get("/register", (req, res) => {
    res.render("register", { layout: "layouts/security", title: "Register" });
  })
  .post("/register", registerUser)
  .get("/login", (req, res) => {
    res.render("login", { layout: "layouts/security", title: "Login" });
  })
  .post("/login", loginUser)
  .get("/logout", logoutUser);

export default router;
