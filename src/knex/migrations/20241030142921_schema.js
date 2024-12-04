/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return (
    knex.schema
      .createTable("users", function (table) {
        table.increments("id");
        table.string("username").unique().index();
        table.string("name").nullable(); // display name
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

      // TODO: User can have multiple rooms with the same name
      .createTable("conversations", function (table) {
        table.increments("id");
        table.string("name").index();
        table.string("description").nullable();
        table.string("avatar").nullable();

        table.boolean("is_active").default(true);
        table.string("is_group").default(false);

        table.integer("owner_id").unsigned();
        table.foreign("owner_id").references("users.id");

        table.timestamps(true, true);
      })
      .createTable("conversation_users", function (table) {
        table.increments("id");
        table.integer("conversation_id").unsigned();
        table.foreign("conversation_id").references("conversations.id");

        table.integer("user_id").unsigned();
        table.foreign("user_id").references("users.id");

        table.timestamps(true, true);
      })
      .createTable("messages", function (table) {
        table.increments("id");
        table.text("content");
        table.string("type").default("text"); // text, image, video, audio, file, etc.

        table.integer("conversation_id").unsigned();
        table.foreign("conversation_id").references("conversations.id");

        table.integer("sender_id").unsigned();
        table.foreign("sender_id").references("users.id");

        table.timestamps(true, true);
      })

    // TODO: Add table meta, notifs, etc.
  );
};

export const down = function (knex) {
  return knex.schema
    .dropTable("messages")
    .dropTable("conversation_users")
    .dropTable("conversations")
    .dropTable("users");
};
