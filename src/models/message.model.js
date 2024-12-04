import knex from "../knex/knex.js";
const table = "messages";

const fields = [
  "id",
  "content",
  "type", // text, image, video, audio, file, etc.
  "conversation_id",
  "sender_id",
  "created_at",
  "updated_at",
];

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

export const getMessageByConversationId = async (conversation_id) => {
  return await knex(table)
    .select(fields)
    .where("conversation_id", conversation_id);
};

export const getMessageBySenderId = async (sender_id) => {
  return await knex(table).select(fields).where("sender_id", sender_id);
};

export const getMessageByType = async (type) => {
  return await knex(table).select(fields).where("type", type);
};
