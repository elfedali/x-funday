import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.routes.js";
import indexRoutes from "./routes/index.routes.js";
// import ApiRoutes from "./routes/api.routes.js";
// import "./config/passport.js"; // Passport configuration

import helmet from "helmet";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(indexRoutes);
app.use(authRoutes);
// app.use(ApiRoutes);

app.get("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

export default app;
