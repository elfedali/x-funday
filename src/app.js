import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bodyParser from "body-parser";
import passport from "passport";
import { sessionMiddleware } from "./middlewares/session.js";
import authRoutes from "./routes/authRoutes.js";
import indexRoutes from "./routes/indexRoutes.js";
import "./config/passport.js"; // Passport configuration

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("view engine", "ejs");
app.set("views", join(__dirname, "../views"));
app.use(express.static(join(__dirname, "../public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(authRoutes);
app.use(indexRoutes);

export default app;
