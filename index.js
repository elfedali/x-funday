import express from "express";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import ejs from "ejs";
// auth
import session from "express-session";
//

import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";

//

const db = await open({
  filename: "./db.sqlite",
  driver: sqlite3.Database,
});
// create message table
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
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
// app.use(
//   express.static(join(dirname(fileURLToPath(import.meta.url)), "public"))
// ); // Serve static files

const sessionMiddleware = session({
  secret: "keyboard_@funday",
  resave: true,
  saveUninitialized: true,
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
//
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await db.get(
      "SELECT * FROM users WHERE username = ?",
      username
    );
    if (!user) {
      return done(null, false, { message: "Incorrect username." });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return done(null, false, { message: "Incorrect password." });
    }
    return done(null, user);
  })
);

//
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};
//
app.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validate form data
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Insert user into the database
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
  res.sendFile(join(__dirname, "register.html"));
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);
passport.serializeUser((user, done) => {
  console.log(`serializeUser ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log(`deserializeUser ${id}`);
  const user = await db.get("SELECT * FROM users WHERE id = ?", id);
  done(null, user);
});
app.get("/login", (req, res) => {
  res.sendFile(join(__dirname, "login.html"));
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      // Handle potential errors during logout
      console.error(err);
      return res.redirect("/"); // Redirect to homepage on error
    }
    res.redirect("/login"); // Redirect to login page on successful logout
  });
});

app.get("/", async (req, res) => {
  const user = await req.user; // Wait for the user to be retrieved
  if (!user) {
    return res.redirect("/login"); // Redirect if not authenticated
  }
  // Use the user data (user.id)
  res.render("index", { user });
});

io.on("connection", async (socket) => {
  console.log("a user connected");

  // Get the user from the session
  console.log(socket.request.user);

  // Get username from logged-in user

  socket.emit("user", socket.request.user);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("chat message", async (msg) => {
    const user = await db.get(
      "SELECT username FROM users WHERE id = ?",
      socket.request.user.id
    ); // Get username from logged-in user
    let result;
    try {
      result = await db.run(
        "INSERT INTO messages (content, user_id) VALUES (?, ?)",
        msg,
        socket.request.user.id
      );
    } catch (e) {
      console.log(e);
      return;
    }
    const messageData = await db.get(
      "SELECT * FROM messages WHERE id = ?",

      result.lastID
    );
    console.log(messageData);

    // Emit the message data object with username and content properties
    io.emit("chat message", {
      username: user.username,
      content: messageData.content,
      id: messageData.id,
    });
  });

  if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      await db.each(
        "SELECT messages.id, messages.content, users.username FROM messages JOIN users ON messages.user_id = users.id WHERE messages.id > ? ORDER BY messages.id ASC",
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit("chat message", {
            username: row.username,
            content: row.content,
            id: row.id,
          });
        }
      );
    } catch (error) {
      console.log(error);
    }
  }
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

function onlyForHandshake(middleware) {
  return (req, res, next) => {
    const isHandshake = req._query.sid === undefined;
    if (isHandshake) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
}

io.engine.use(onlyForHandshake(sessionMiddleware));
io.engine.use(onlyForHandshake(passport.session()));
io.engine.use(
  onlyForHandshake((req, res, next) => {
    if (req.user) {
      next();
    } else {
      res.writeHead(401);
      res.end();
    }
  })
);
