import { getUserById } from "../models/user.model.js";
import knex from "../knex/knex.js";
// import { sessionMiddleware } from "../middlewares/session.js";
// import passport from "passport";
import { createMessage } from "../models/message.model.js";

// const db = await initializeDb();
const users = new Map();
export const setupChatSockets = (io) => {
  io.use((socket, next) => {
    // sessionMiddleware(socket.request, {}, next);
  });

  io.use((socket, next) => {
    // passport.initialize()(socket.request, {}, next);
  });

  io.use((socket, next) => {
    // passport.session()(socket.request, {}, next);
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

    socket.on(
      "direct message",
      async ({ recipientId, message, type = "text" }) => {
        const user = await getUserById(socket.request.user.id); // Get sender details
        if (!user) return;

        // Check if a room exists between sender and recipient
        let room = await knex("rooms")
          .join("room_users as ru1", "rooms.id", "ru1.room_id")
          .join("room_users as ru2", "rooms.id", "ru2.room_id")
          .where("ru1.user_id", socket.request.user.id)
          .andWhere("ru2.user_id", recipientId)
          .first();

        if (!room) {
          // If no room, create one
          const [roomId] = await knex("rooms").insert({
            name: `Room_${socket.request.user.id}_${recipientId}`,
          });
          await knex("room_users").insert([
            { room_id: roomId, user_id: socket.request.user.id },
            { room_id: roomId, user_id: recipientId },
          ]);
        }
        // Fetch the room from the database
        room = await knex("rooms")
          .join("room_users as ru1", "rooms.id", "ru1.room_id")
          .join("room_users as ru2", "rooms.id", "ru2.room_id")
          .where("ru1.user_id", socket.request.user.id)
          .andWhere("ru2.user_id", recipientId)
          .first();

        // Store message in `messages` table and associate it with the room
        const [messageId] = await knex("messages").insert({
          content: message,
          user_id: socket.request.user.id,
        });

        await knex("room_messages").insert({
          room_id: room.room_id,
          message_id: messageId,
        });

        // Fetch the message from the database
        const storedMessage = await knex("messages")
          .where({ id: messageId })
          .first();

        // Notify recipient of the new message in the room
        let recipientSocketId = users.get(Number(recipientId));
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("direct message", {
            senderId: socket.request.user.id,
            senderUsername: user.username,
            roomId: room.id,
            content: storedMessage.content,
            id: storedMessage.id,
            type,
          });
        }
      }
    );

    /* if (!socket.recovered) {
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
    */
  });
};
