/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable("sessions", (table) => {
    table.increments("id").primary();
    table.string("sid").notNullable();
    table.json("sess").notNullable();
    table.timestamp("expired").notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTable("sessions");
};
