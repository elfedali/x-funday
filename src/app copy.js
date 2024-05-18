import express from "express";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import ejs from "ejs";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";

const initializeApp = async () => {
  const db = await open({
    filename: "./db.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT NULL,
        bio TEXT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_id ON users (id);
    CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users (username);
    CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email);

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS messages_id ON messages (id);

    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS rooms_id ON rooms (id);

    CREATE TABLE IF NOT EXISTS room_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS room_users_id ON room_users (id);

    CREATE TABLE IF NOT EXISTS room_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        message_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS room_messages_id ON room_messages (id);
  `);

  const app = express();
  const server = createHttpServer(app);
  const io = new SocketServer(server);
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const port = 3000;

  // Middleware
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static(join(__dirname, "public")));

  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "keyboard_@funday",
    resave: true,
    saveUninitialized: true,
  });

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
  app.set("view engine", "ejs");
  app.set("views", join(__dirname, "views"));

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await db.get(
          "SELECT * FROM users WHERE username = ?",
          username
        );
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.get("SELECT * FROM users WHERE id = ?", id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  };

  app.post("/register", async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      await db.run(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        username,
        email,
        hashedPassword
      );
      res.redirect("/login");
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send(
          "An error occurred during registration <a href='/register'>Try again</a>"
        );
    }
  });

  app.get("/register", (req, res) => {
    res.render("register");
  });

  app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
      failureFlash: true,
    })
  );

  app.get("/login", (req, res) => {
    res.render("login");
  });

  app.get("/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error(err);
        return res.redirect("/");
      }
      res.redirect("/login");
    });
  });

  app.get("/", isAuthenticated, async (req, res) => {
    const user = req.user;
    res.render("index", { user });
  });

  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  io.use((socket, next) => {
    passport.initialize()(socket.request, {}, next);
  });

  io.use((socket, next) => {
    passport.session()(socket.request, {}, next);
  });

  io.use((socket, next) => {
    if (socket.request.user) {
      next();
    } else {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("a user connected", socket.request.user);

    socket.emit("user", socket.request.user);

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    socket.on("chat message", async (msg) => {
      try {
        const result = await db.run(
          "INSERT INTO messages (content, user_id) VALUES (?, ?)",
          msg,
          socket.request.user.id
        );
        const messageData = await db.get(
          "SELECT * FROM messages WHERE id = ?",
          result.lastID
        );
        io.emit("chat message", {
          username: socket.request.user.username,
          content: messageData.content,
          id: messageData.id,
        });
      } catch (error) {
        console.error(error);
      }
    });

    if (!socket.recovered) {
      try {
        await db.each(
          "SELECT messages.id, messages.content, users.username FROM messages JOIN users ON messages.user_id = users.id WHERE messages.id > ? ORDER BY messages.id ASC",
          [socket.handshake.auth.serverOffset || 0],
          (err, row) => {
            if (err) {
              throw err;
            }
            socket.emit("chat message", {
              username: row.username,
              content: row.content,
              id: row.id,
            });
          }
        );
      } catch (error) {
        console.error(error);
      }
    }
  });

  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`To exit press Ctrl+C`);
  });
};

initializeApp().catch(console.error);
