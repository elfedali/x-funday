import express from "express";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
  filename: "./db.sqlite",
  driver: sqlite3.Database,
});
// create message table
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL
  )
`);
const app = express();
const server = createHttpServer(app);

const io = new SocketServer(server);

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", async (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("chat message", async (msg) => {
    let result;
    try {
      result = await db.run("INSERT INTO messages (content) VALUES (?)", msg);
    } catch (e) {
      console.log(e);
      return;
    }
    io.emit("chat message", msg, result.lastID);
  });

  if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      await db.each(
        "SELECT id, content FROM messages WHERE id > ?",
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit("chat message", row.content, row.id);
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
