import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  res.json({
    message: "Welcome to the chat API",
    appName: "ProChat API",
    appVersion: "1.0.0",
    nodeVersion: process.version,
  });
});

export default router;
