import knex from "../knex/knex.js";

const table2 = "conversation_users";

const fields2 = [
  "id",
  "conversation_id",
  "user_id",
  "created_at",
  "updated_at",
];

export const getConversationUsers = async () => {
  return await knex(table2).select(fields2);
};

export const getConversationUserById = async (id) => {
  return await knex(table2).select(fields2).where("id", id).first();
};

export const createConversationUser = async (props) => {
  console.log("props", props);
  return await knex(table2).insert(props).returning(fields2);
};

export const updateConversationUser = async (id, fields) => {
  return await knex(table2).where("id", id).update(fields).returning("*");
};

export const deleteConversationUser = async (id) => {
  return await knex(table2).where("id", id).del();
};

export const getConversationUserByConversationId = async (conversation_id) => {
  return await knex(table2)
    .select(fields2)
    .where("conversation_id", conversation_id);
};

export const getConversationUserByUserId = async (user_id) => {
  return await knex(table2).select(fields2).where("user_id", user_id);
};
