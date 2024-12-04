import knex from "../knex/knex.js";
const table = "conversations";
const table2 = "conversation_users";
const table_users = "users";

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
const fields2 = [
  "id",
  "conversation_id",
  "user_id",
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

// getAllConversationWhereUserIs
export const getAllConversationWhereUserIs = async (user_id) => {
  return await knex(table)
    .select(
      `${table}.id`,
      `${table}.name`,
      `${table}.description`,
      `${table}.avatar`,
      `${table}.is_active`,
      `${table}.is_group`,
      `${table}.owner_id`,
      `${table}.created_at`,
      `${table}.updated_at`,
      `${table2}.user_id`,
      `${table2}.created_at as joined_at`,
      `${table2}.updated_at as left_at`
    )
    .join(table2, `${table}.id`, `${table2}.conversation_id`)
    .where(`${table2}.user_id`, user_id);
};

// getConversationMembers join user table
export const getConversationMembers = async (conversation_id) => {
  return await knex(table2)
    .select(
      `${table2}.id`,
      `${table2}.conversation_id`,
      `${table2}.user_id`,
      "users.id",
      "users.username",
      "users.name",
      "users.email",
      "users.avatar",
      "users.bio",
      "users.is_admin",
      "users.is_active",
      "users.is_verified",
      "users.created_at",
      "users.updated_at"
    )
    .join("users", `${table2}.user_id`, "users.id")
    .where(`${table2}.conversation_id`, conversation_id);
};
