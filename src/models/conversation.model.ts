import db from '../knex/knex.js';
import {
  Conversation,
  ConversationUser,
  ConversationRole,
  CreateConversationRequest,
  UserProfile,
} from '@/types/index.js';

const conversationTable = 'conversations';
const conversationUserTable = 'conversation_users';
const userTable = 'users';

const conversationFields = [
  'id',
  'name',
  'description',
  'avatar',
  'is_active',
  'is_group',
  'owner_id',
  'created_at',
  'updated_at',
] as const;

const conversationUserFields = [
  'id',
  'conversation_id',
  'user_id',
  'role',
  'joined_at',
  'last_read_at',
] as const;

export const getAllConversations = async (): Promise<Conversation[]> => {
  return await db(conversationTable)
    .select(conversationFields)
    .where('is_active', true)
    .orderBy('updated_at', 'desc');
};

export const getConversationById = async (id: number): Promise<Conversation | null> => {
  const conversation = await db(conversationTable)
    .select(conversationFields)
    .where('id', id)
    .where('is_active', true)
    .first();
  return conversation || null;
};

export const createConversation = async (
  conversationData: CreateConversationRequest & { owner_id: number }
): Promise<Conversation> => {
  const [conversation] = await db(conversationTable)
    .insert({
      ...conversationData,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning(conversationFields);
  return conversation;
};

export const updateConversation = async (
  id: number,
  updateData: Partial<Conversation>
): Promise<Conversation> => {
  const [conversation] = await db(conversationTable)
    .where('id', id)
    .where('is_active', true)
    .update({
      ...updateData,
      updated_at: new Date(),
    })
    .returning(conversationFields);
  return conversation;
};

export const deleteConversation = async (id: number): Promise<void> => {
  await db(conversationTable).where('id', id).update({
    is_active: false,
    updated_at: new Date(),
  });
};

export const hardDeleteConversation = async (id: number): Promise<number> => {
  return await db(conversationTable).where('id', id).del();
};

export const getConversationsByOwnerId = async (ownerId: number): Promise<Conversation[]> => {
  return await db(conversationTable)
    .select(conversationFields)
    .where('owner_id', ownerId)
    .where('is_active', true)
    .orderBy('updated_at', 'desc');
};

export const getConversationByName = async (name: string): Promise<Conversation | null> => {
  const conversation = await db(conversationTable)
    .select(conversationFields)
    .where('name', name)
    .where('is_active', true)
    .first();
  return conversation || null;
};

export const getUserConversations = async (
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<(Conversation & { unread_count: number; last_message?: any })[]> => {
  const conversations = await db(conversationTable)
    .select([
      ...conversationFields.map(field => `${conversationTable}.${field}`),
      db.raw(
        `
        COALESCE(
          (SELECT COUNT(*) FROM messages m 
           WHERE m.conversation_id = ${conversationTable}.id 
           AND m.sender_id != ? 
           AND m.read_at IS NULL 
           AND m.is_deleted = false), 
          0
        ) as unread_count
      `,
        [userId]
      ),
      db.raw(`
        (SELECT json_object(
          'id', m.id,
          'content', m.content,
          'message_type', m.message_type,
          'created_at', m.created_at,
          'sender', json_object(
            'id', u.id,
            'username', u.username,
            'name', u.name
          )
        ) FROM messages m
        LEFT JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ${conversationTable}.id 
        AND m.is_deleted = false
        ORDER BY m.created_at DESC 
        LIMIT 1) as last_message
      `),
    ])
    .innerJoin(
      conversationUserTable,
      `${conversationTable}.id`,
      `${conversationUserTable}.conversation_id`
    )
    .where(`${conversationUserTable}.user_id`, userId)
    .where(`${conversationTable}.is_active`, true)
    .orderBy(`${conversationTable}.updated_at`, 'desc')
    .limit(limit)
    .offset(offset);

  return conversations;
};

export const getConversationMembers = async (
  conversationId: number
): Promise<(UserProfile & { role: ConversationRole; joined_at: Date })[]> => {
  return await db(conversationUserTable)
    .select([
      'users.id',
      'users.username',
      'users.name',
      'users.email',
      'users.avatar',
      'users.bio',
      'users.is_active',
      'users.is_verified',
      'users.last_seen',
      'users.created_at',
      'users.updated_at',
      `${conversationUserTable}.role`,
      `${conversationUserTable}.joined_at`,
    ])
    .innerJoin('users', 'users.id', `${conversationUserTable}.user_id`)
    .where(`${conversationUserTable}.conversation_id`, conversationId)
    .where('users.is_active', true);
};

export const addUserToConversation = async (
  conversationId: number,
  userId: number,
  role: ConversationRole = ConversationRole.MEMBER
): Promise<ConversationUser> => {
  const [conversationUser] = await db(conversationUserTable)
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      joined_at: new Date(),
    })
    .returning(conversationUserFields);
  return conversationUser;
};

export const removeUserFromConversation = async (
  conversationId: number,
  userId: number
): Promise<void> => {
  await db(conversationUserTable)
    .where('conversation_id', conversationId)
    .where('user_id', userId)
    .del();
};

export const updateUserRoleInConversation = async (
  conversationId: number,
  userId: number,
  role: ConversationRole
): Promise<ConversationUser> => {
  const [conversationUser] = await db(conversationUserTable)
    .where('conversation_id', conversationId)
    .where('user_id', userId)
    .update({ role })
    .returning(conversationUserFields);
  return conversationUser;
};

export const isUserInConversation = async (
  conversationId: number,
  userId: number
): Promise<boolean> => {
  const result = await db(conversationUserTable)
    .select('id')
    .where('conversation_id', conversationId)
    .where('user_id', userId)
    .first();
  return !!result;
};

export const getUserRoleInConversation = async (
  conversationId: number,
  userId: number
): Promise<ConversationRole | null> => {
  const result = await db(conversationUserTable)
    .select('role')
    .where('conversation_id', conversationId)
    .where('user_id', userId)
    .first();
  return result?.role || null;
};

export const updateLastReadAt = async (conversationId: number, userId: number): Promise<void> => {
  await db(conversationUserTable)
    .where('conversation_id', conversationId)
    .where('user_id', userId)
    .update({ last_read_at: new Date() });
};

export const searchConversations = async (
  query: string,
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<Conversation[]> => {
  return await db(conversationTable)
    .select(conversationFields.map(field => `${conversationTable}.${field}`))
    .innerJoin(
      conversationUserTable,
      `${conversationTable}.id`,
      `${conversationUserTable}.conversation_id`
    )
    .where(`${conversationUserTable}.user_id`, userId)
    .where(`${conversationTable}.name`, 'like', `%${query}%`)
    .where(`${conversationTable}.is_active`, true)
    .orderBy(`${conversationTable}.updated_at`, 'desc')
    .limit(limit)
    .offset(offset);
};

export const getDirectConversation = async (
  user1Id: number,
  user2Id: number
): Promise<Conversation | null> => {
  const conversation = await db(conversationTable)
    .select(conversationFields)
    .innerJoin(
      db(conversationUserTable)
        .select('conversation_id')
        .whereIn('user_id', [user1Id, user2Id])
        .groupBy('conversation_id')
        .havingRaw('COUNT(DISTINCT user_id) = 2')
        .as('user_conversations'),
      `${conversationTable}.id`,
      'user_conversations.conversation_id'
    )
    .where(`${conversationTable}.is_group`, false)
    .where(`${conversationTable}.is_active`, true)
    .first();

  return conversation || null;
};

export const getConversationsCount = async (userId?: number): Promise<number> => {
  let query = db(conversationTable).count('id as count').where('is_active', true);

  if (userId) {
    query = query
      .innerJoin(
        conversationUserTable,
        `${conversationTable}.id`,
        `${conversationUserTable}.conversation_id`
      )
      .where(`${conversationUserTable}.user_id`, userId);
  }

  const result = await query.first();
  return (result?.['count'] as number) || 0;
};
