import knex from "../db/knex";

const table2 = "conversation_users";

const fields2 = [
  "id",
  "conversation_id",
  "owner_id",
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

export const getConversationUserByOwnerId = async (owner_id) => {
  return await knex(table2).select(fields2).where("owner_id", owner_id);
};

export const getConversationUserByConversationIdAndOwnerId = async (
  conversation_id,
  owner_id
) => {
  return await knex(table2)
    .select(fields2)
    .where("conversation_id", conversation_id)
    .andWhere("owner_id", owner_id)
    .first();
};
