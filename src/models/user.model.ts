import db from '../knex/knex.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { User, UserProfile } from '../types/index.js';
import { config } from '../config/env.js';

const table = 'users';

const fields = [
  'id',
  'username',
  'name',
  'email',
  'password',
  'avatar',
  'bio',
  'is_admin',
  'is_active',
  'verify_token',
  'is_verified',
  'last_seen',
  'created_at',
  'updated_at',
] as const;

const publicFields = [
  'id',
  'username',
  'name',
  'email',
  'avatar',
  'bio',
  'is_admin',
  'is_active',
  'is_verified',
  'last_seen',
  'created_at',
  'updated_at',
] as const;

export const getAllUsers = async (): Promise<UserProfile[]> => {
  return await db(table).select(publicFields);
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const user = await db(table).select(fields).where('username', username).first();
  return user || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await db(table).select(fields).where('email', email).first();
  return user || null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const user = await db(table).select(fields).where('id', id).first();
  return user || null;
};

export const getUserPublicProfile = async (id: number): Promise<UserProfile | null> => {
  const user = await db(table).select(publicFields).where('id', id).first();
  return user || null;
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const [user] = await db(table).insert(userData).returning(fields);
  return user;
};

export const updateUser = async (id: number, updateData: Partial<User>): Promise<User> => {
  const [user] = await db(table)
    .where('id', id)
    .update({ ...updateData, updated_at: new Date() })
    .returning(fields);
  return user;
};

export const deleteUser = async (id: number): Promise<number> => {
  return await db(table).where('id', id).del();
};

export const searchUsers = async (
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<UserProfile[]> => {
  return await db(table)
    .select(publicFields)
    .where('username', 'like', `%${query}%`)
    .orWhere('name', 'like', `%${query}%`)
    .where('is_active', true)
    .orderBy('username', 'asc')
    .limit(limit)
    .offset(offset);
};

export const getUsersCount = async (): Promise<number> => {
  const result = await db(table).count('id as count').first();
  return (result?.['count'] as number) || 0;
};

export const getActiveUsersCount = async (): Promise<number> => {
  const result = await db(table).count('id as count').where('is_active', true).first();
  return (result?.['count'] as number) || 0;
};

export const getUsersByIds = async (ids: number[]): Promise<UserProfile[]> => {
  if (ids.length === 0) return [];

  return await db(table).select(publicFields).whereIn('id', ids).where('is_active', true);
};

// Utility functions
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (length: number = 30): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const isUserActive = (user: User): boolean => {
  return user.is_active;
};

export const isUserVerified = (user: User): boolean => {
  return user.is_verified;
};

export const isUserAdmin = (user: User): boolean => {
  return user.is_admin;
};
