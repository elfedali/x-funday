import session from "express-session";

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "keyboard_@funday",
  resave: true,
  saveUninitialized: true,
});
