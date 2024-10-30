/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema
    .createTable("users", function (table) {
      table.increments("id");
      table.string("username").unique().index();
      table.string("name").nullable();
      table.string("email").unique().index();
      table.string("password");
      table.string("avatar").nullable();
      table.string("bio").nullable();
      table.boolean("is_admin").defaultTo(false);
      table.boolean("is_active").defaultTo(true);
      table.string("verify_token").nullable();
      table.boolean("is_verified").defaultTo(false);

      table.timestamps(true, true);
    })
    .createTable("messages", function (table) {
      table.increments("id");
      table.text("content");
      table.integer("user_id").unsigned();
      table
        .foreign("user_id")
        .references("users.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");

      table.timestamps(true, true);
    })
    .createTable("rooms", function (table) {
      table.increments("id");
      table.string("name");

      table.timestamps();
    })
    .createTable("room_users", function (table) {
      table.increments("id");
      table.integer("room_id").unsigned();
      table
        .foreign("room_id")
        .references("rooms.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table.integer("user_id").unsigned();
      table
        .foreign("user_id")
        .references("users.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");

      table.timestamps(true, true);
    })
    .createTable("room_messages", function (table) {
      table.increments("id");
      table.integer("room_id").unsigned();
      table
        .foreign("room_id")
        .references("rooms.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table.integer("message_id").unsigned();
      table
        .foreign("message_id")
        .references("messages.id")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");

      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema
    .dropTable("room_messages")
    .dropTable("room_users")
    .dropTable("rooms")
    .dropTable("messages")
    .dropTable("users");
};
