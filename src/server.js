import { createServer as createHttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import { initializeDb } from "./db/init.js";
import { setupChatSockets } from "./sockets/chat.js";

dotenv.config();

const server = createHttpServer(app);
const io = new SocketServer(server);

setupChatSockets(io);

const port = process.env.PORT || 3000;

(async () => {
  await initializeDb();
  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})();
