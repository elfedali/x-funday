import knex from "../knex/knex.js";
const table = "messages";

const fields = ["id", "content", "user_id", "created_at", "updated_at"];

export const getMessages = async () => {
  return await knex(table).select(fields);
};

export const getMessageById = async (id) => {
  return await knex(table).select(fields).where("id", id).first();
};

export const createMessage = async (props) => {
  return await knex(table).insert(props).returning(fields);
};

export const updateMessage = async (id, fields) => {
  return await knex(table).where("id", id).update(fields).returning("*");
};

export const deleteMessage = async (id) => {
  return await knex(table).where("id", id).del();
};
