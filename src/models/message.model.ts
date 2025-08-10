import db from '../knex/knex.js';
import { Message, MessageType, CreateMessageRequest } from '@/types/index.js';

const table = 'messages';

const fields = [
  'id',
  'conversation_id',
  'sender_id',
  'content',
  'message_type',
  'file_url',
  'file_name',
  'file_size',
  'is_edited',
  'is_deleted',
  'reply_to_id',
  'delivered_at',
  'read_at',
  'created_at',
  'updated_at',
] as const;

export const getAllMessages = async (): Promise<Message[]> => {
  return await db(table).select(fields).where('is_deleted', false);
};

export const getMessageById = async (id: number): Promise<Message | null> => {
  const message = await db(table).select(fields).where('id', id).where('is_deleted', false).first();
  return message || null;
};

export const createMessage = async (
  messageData: CreateMessageRequest & { sender_id: number }
): Promise<Message> => {
  const [message] = await db(table)
    .insert({
      ...messageData,
      message_type: messageData.message_type || MessageType.TEXT,
      is_edited: false,
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(fields);
  return message;
};

export const updateMessage = async (id: number, updateData: Partial<Message>): Promise<Message> => {
  const [message] = await db(table)
    .where('id', id)
    .where('is_deleted', false)
    .update({
      ...updateData,
      is_edited: true,
      updated_at: new Date(),
    })
    .returning(fields);
  return message;
};

export const softDeleteMessage = async (id: number): Promise<void> => {
  await db(table).where('id', id).update({
    is_deleted: true,
    updated_at: new Date(),
  });
};

export const deleteMessage = async (id: number): Promise<number> => {
  return await db(table).where('id', id).del();
};

export const getMessagesByConversationId = async (
  conversationId: number,
  limit: number = 50,
  offset: number = 0,
  beforeMessageId?: number
): Promise<Message[]> => {
  let query = db(table)
    .select([
      ...fields,
      db.raw(`
        json_object(
          'id', u.id,
          'username', u.username,
          'name', u.name,
          'avatar', u.avatar
        ) as sender
      `),
    ])
    .leftJoin('users as u', 'u.id', `${table}.sender_id`)
    .where(`${table}.conversation_id`, conversationId)
    .where(`${table}.is_deleted`, false)
    .orderBy(`${table}.created_at`, 'desc');

  if (beforeMessageId) {
    const beforeMessage = await getMessageById(beforeMessageId);
    if (beforeMessage) {
      query = query.where(`${table}.created_at`, '<', beforeMessage.created_at);
    }
  }

  return await query.limit(limit).offset(offset);
};

export const getMessagesBySenderId = async (senderId: number): Promise<Message[]> => {
  return await db(table)
    .select(fields)
    .where('sender_id', senderId)
    .where('is_deleted', false)
    .orderBy('created_at', 'desc');
};

export const getMessagesByType = async (messageType: MessageType): Promise<Message[]> => {
  return await db(table)
    .select(fields)
    .where('message_type', messageType)
    .where('is_deleted', false)
    .orderBy('created_at', 'desc');
};

export const markMessageAsDelivered = async (id: number): Promise<void> => {
  await db(table).where('id', id).update({
    delivered_at: new Date(),
    updated_at: new Date(),
  });
};

export const markMessageAsRead = async (id: number): Promise<void> => {
  await db(table).where('id', id).update({
    read_at: new Date(),
    updated_at: new Date(),
  });
};

export const markConversationMessagesAsRead = async (
  conversationId: number,
  userId: number
): Promise<void> => {
  await db(table)
    .where('conversation_id', conversationId)
    .where('sender_id', '!=', userId)
    .whereNull('read_at')
    .update({
      read_at: new Date(),
      updated_at: new Date(),
    });
};

export const getUnreadMessagesCount = async (
  conversationId: number,
  userId: number
): Promise<number> => {
  const result = await db(table)
    .count('id as count')
    .where('conversation_id', conversationId)
    .where('sender_id', '!=', userId)
    .whereNull('read_at')
    .where('is_deleted', false)
    .first();
  return (result?.['count'] as number) || 0;
};

export const searchMessages = async (
  query: string,
  conversationId?: number,
  limit: number = 20,
  offset: number = 0
): Promise<Message[]> => {
  let dbQuery = db(table)
    .select([
      ...fields,
      db.raw(`
        json_object(
          'id', u.id,
          'username', u.username,
          'name', u.name,
          'avatar', u.avatar
        ) as sender
      `),
    ])
    .leftJoin('users as u', 'u.id', `${table}.sender_id`)
    .where(`${table}.content`, 'like', `%${query}%`)
    .where(`${table}.is_deleted`, false);

  if (conversationId) {
    dbQuery = dbQuery.where(`${table}.conversation_id`, conversationId);
  }

  return await dbQuery.orderBy(`${table}.created_at`, 'desc').limit(limit).offset(offset);
};

export const getLatestMessageByConversationId = async (
  conversationId: number
): Promise<Message | null> => {
  const message = await db(table)
    .select(fields)
    .where('conversation_id', conversationId)
    .where('is_deleted', false)
    .orderBy('created_at', 'desc')
    .first();
  return message || null;
};

export const getMessagesCount = async (conversationId?: number): Promise<number> => {
  let query = db(table).count('id as count').where('is_deleted', false);

  if (conversationId) {
    query = query.where('conversation_id', conversationId);
  }

  const result = await query.first();
  return (result?.['count'] as number) || 0;
};
