import { getUserById } from "../models/user.model.js";
import knex from "../knex/knex.js";
import { sessionMiddleware } from "../middlewares/session.js";
import passport from "passport";
import { createMessage } from "../models/message.model.js";

// const db = await initializeDb();
const users = new Map();
export const setupChatSockets = (io) => {
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
    const sessionID = socket.id;
    console.log("sessionID", sessionID);
    console.log("a user connected");

    // Get the user from the session
    console.log(socket.request.user);
    // SET THE USER ID AND SOCKET ID IN THE MAP
    users.set(socket.request.user.id, socket.id);

    // Get username from logged-in user
    //socket.emit("user", socket.request.user);

    socket.on("disconnect", () => {
      console.log("user disconnected");
      users.delete(socket.request.user.id);
    });

    socket.on("chat message", async (msg) => {
      console.log("server message: " + msg);
      const user = await getUserById(socket.request.user.id); // Get username from logged-in user
      if (!user) {
        return;
      }
      let result;

      await createMessage({
        content: msg,
        user_id: socket.request.user.id,
      }).then((res) => {
        result = res;
      });

      io.emit("chat message", {
        username: user.username,
        content: msg,
        id: result[0].id,
      });
    });

    socket.on("direct message", async ({ recipientId, message }) => {
      const user = await getUserById(socket.request.user.id); // Get username from logged-in user
      if (!user) {
        return;
      }

      console.log("message", message);
      let recipientSocketId = users.get(Number(recipientId));

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("direct message", {
          username: user.username,
          content: message,
        });
      }
    });

    if (!socket.recovered) {
      // if the connection state recovery was not successful
      try {
        const messages = await knex("messages")
          .join("users", "messages.user_id", "users.id")
          .select("messages.id", "messages.content", "users.username")
          .where("messages.id", ">", socket.handshake.auth.serverOffset || 0)
          .orderBy("messages.id", "asc");

        messages.forEach((row) => {
          socket.emit("chat message", {
            username: row.username,
            content: row.content,
            id: row.id,
          });
        });
      } catch (error) {
        console.log(error);
      }
    }
  });
};
