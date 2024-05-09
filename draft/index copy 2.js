import express from "express";
import { createServer as createHttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const app = express();
const server = createHttpServer(app);

const io = new SocketServer(server);

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
