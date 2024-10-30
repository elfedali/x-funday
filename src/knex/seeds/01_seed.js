/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

import bcrypt from "bcrypt";
export const seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();
  await knex("users").insert([
    {
      id: 1,
      username: "webmaster",
      email: "webmaster@prochat.ma",
      password: await bcrypt.hash("password", 10),
      bio: "I am the product owner of ProChat",
      is_admin: true,
      is_active: true,
    },
  ]);
};
