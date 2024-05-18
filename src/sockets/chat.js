import { getUserById } from "../models/userModel.js";
import { initializeDb } from "../db/init.js";
import { sessionMiddleware } from "../middlewares/session.js";
import passport from "passport";

const db = await initializeDb();

export function setupChatSockets(io) {
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
    console.log("a user connected");

    // Get the user from the session
    console.log(socket.request.user);

    // Get username from logged-in user
    socket.emit("user", socket.request.user);

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    socket.on("chat message", async (msg) => {
      const user = await getUserById(socket.request.user.id); // Get username from logged-in user

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
}
