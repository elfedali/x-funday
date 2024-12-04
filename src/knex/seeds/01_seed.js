/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

import bcrypt from "bcrypt";
import { name } from "ejs";
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();
  await knex("users").insert([
    {
      username: "webmaster",
      name: "ProChat Webmaster",
      email: "webmaster@prochat.ma",
      password: await bcrypt.hash("password", 10),
      bio: "I am the product owner of ProChat",
      is_admin: true,
      is_active: true,
    },
    {
      username: "ali",
      name: "Ali El Haddadi",
      email: "ali@prochat.ma",
      password: await bcrypt.hash("password", 10),
      bio: "I am a demo user of ProChat",
      is_admin: true,
      is_active: true,
    },
    {
      username: "abdessamad",
      name: "Abdessamad Elfedali",
      email: "se@prochat.ma",
      password: await bcrypt.hash("password", 10),
      bio: "I am a demo user of ProChat",
      is_admin: true,
      is_active: true,
    },
  ]);

  await knex("conversations").del();
  await knex("conversations").insert([
    {
      name: "General",
      description: "General discussion",
      avatar: "https://i.pravatar.cc/300",
      is_active: true,
      is_group: true,
      owner_id: 1,
    },
    {
      name: "Ali and Abdessamad",
      description: "Private discussion between Ali and Abdessamad",
      avatar: "https://i.pravatar.cc/300",
      is_active: true,
      is_group: false,
      owner_id: 1,
    },
  ]);

  await knex("conversation_users").del();

  await knex("conversation_users").insert([
    {
      conversation_id: 1,
      user_id: 1,
    },
    {
      conversation_id: 1,
      user_id: 2,
    },
    {
      conversation_id: 2,
      user_id: 1,
    },
    {
      conversation_id: 2,
      user_id: 3,
    },
  ]);

  await knex("messages").del();

  await knex("messages").insert([
    {
      content: "Hello, World!",
      type: "text",
      conversation_id: 1,
      sender_id: 1,
    },
    {
      content: "Hello, Webmaster!",
      type: "text",
      conversation_id: 1,
      sender_id: 2,
    },
    {
      content: "Hello, Ali!",
      type: "text",
      conversation_id: 2,
      sender_id: 1,
    },
    {
      content: "Hello, Abdessamad!",
      type: "text",
      conversation_id: 2,
      sender_id: 3,
    },
  ]);
};
