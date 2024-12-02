import { Router } from "express";

const router = Router();
import knex from "../knex/knex.js";

router.get("/api/messages/:recipientId", async (req, res) => {
  const { recipientId } = req.params;
  const current_user = req.user;

  // Check if a room exists between sender and recipient
  let room = await knex("rooms")
    .join("room_users as ru1", "rooms.id", "ru1.room_id")
    .join("room_users as ru2", "rooms.id", "ru2.room_id")
    .where("ru1.user_id", current_user.id)
    .andWhere("ru2.user_id", recipientId)
    .first();

  if (!room) {
    // If no room, create one
    const [roomId] = await knex("rooms").insert({
      name: `Room_${current_user.id}_${recipientId}`,
    });
    await knex("room_users").insert([
      { room_id: roomId, user_id: current_user.id },
      { room_id: roomId, user_id: recipientId },
    ]);
  }
  // Fetch the room from the database
  room = await knex("rooms")
    .join("room_users as ru1", "rooms.id", "ru1.room_id")
    .join("room_users as ru2", "rooms.id", "ru2.room_id")
    .where("ru1.user_id", current_user.id)
    .andWhere("ru2.user_id", recipientId)
    .first();

  // Get messages in the room
  const messages = await knex("room_messages")
    .join("messages", "room_messages.message_id", "messages.id")
    .where("room_messages.room_id", room.room_id)
    .select("messages.*");

  res.json(messages);
});

export default router;
