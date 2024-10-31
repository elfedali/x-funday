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
};
