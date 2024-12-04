import knex from "../knex/knex.js";
const table = "conversations";

const fields = [
  "id",
  "name",
  "description",
  "avatar",
  "is_active",
  "is_group",
  "owner_id",
  "created_at",
  "updated_at",
];

export const getConversations = async () => {
  return await knex(table).select(fields);
};

export const getConversationById = async (id) => {
  return await knex(table).select(fields).where("id", id).first();
};

export const createConversation = async (props) => {
  return await knex(table).insert(props).returning(fields);
};

export const updateConversation = async (id, fields) => {
  return await knex(table).where("id", id).update(fields).returning("*");
};

export const deleteConversation = async (id) => {
  return await knex(table).where("id", id).del();
};

export const getConversationByOwnerId = async (owner_id) => {
  return await knex(table).select(fields).where("owner_id", owner_id);
};

export const getConversationByName = async (name) => {
  return await knex(table).select(fields).where("name", name).first();
};

export const getConversationByIsGroup = async (is_group) => {
  return await knex(table).select(fields).where("is_group", is_group);
};

export const getConversationByIsActive = async (is_active) => {
  return await knex(table).select(fields).where("is_active", is_active);
};

export const getConversationByOwnerIdAndName = async (owner_id, name) => {
  return await knex(table)
    .select(fields)
    .where("owner_id", owner_id)
    .andWhere("name", name)
    .first();
};

export const getConversationByOwnerIdAndIsActive = async (
  owner_id,
  is_active
) => {
  return await knex(table)
    .select(fields)
    .where("owner_id", owner_id)
    .andWhere("is_active", is_active);
};
