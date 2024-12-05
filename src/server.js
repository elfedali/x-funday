import { createServer as createHttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import { setupChatSockets } from "./sockets/chat.js";

dotenv.config();

const server = createHttpServer(app);
const io = new SocketServer(
  server,

  {
    cors: {
      origin: "*",
    },
  }
);

setupChatSockets(io);

const port = process.env.PORT || 3000;

(async () => {
  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})();
export { server, io, app };
