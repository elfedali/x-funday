import { Router } from "express";
import env from "../helpers/env.js";

const router = Router();

router.get("/", async (req, res) => {
  res.json({
    appName: env.APP_NAME,
    appVersion: env.APP_VERSION,
    nodeVersion: process.version,
  });
});

export default router;
