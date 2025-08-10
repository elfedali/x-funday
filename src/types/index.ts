import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// User Types
export interface User {
  id: number;
  username: string;
  name?: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  is_admin: boolean;
  is_active: boolean;
  is_verified: boolean;
  verify_token?: string;
  last_seen?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: number;
  username: string;
  name?: string;
  email: string;
  avatar?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
  last_seen?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface LoginRequest {
  login: string; // username or email
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateUserRequest {
  name?: string;
  bio?: string;
  avatar?: string;
}

// JWT Types
export interface JwtUser extends JwtPayload {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUser;
}

// Message Types
export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: MessageType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id?: number;
  delivered_at?: Date;
  read_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system',
}

export interface CreateMessageRequest {
  conversation_id: number;
  content: string;
  message_type?: MessageType;
  reply_to_id?: number;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface MessageQuery {
  search?: string;
  conversationId?: number;
  limit?: number;
  offset?: number;
  before?: Date;
}

export interface UserSearchQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UserPresence {
  userId: number;
  isOnline: boolean;
  lastSeen: Date;
  status: 'online' | 'offline' | 'away';
}

// Conversation Types
export interface Conversation {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  is_active: boolean;
  is_group: boolean;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationUser {
  id: number;
  conversation_id: number;
  user_id: number;
  role: ConversationRole;
  joined_at: Date;
  last_read_at?: Date;
}

export enum ConversationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export interface CreateConversationRequest {
  name: string;
  description?: string;
  is_group: boolean;
  user_ids?: number[];
}

export interface UpdateConversationRequest {
  name?: string;
  description?: string;
}

export interface ConversationQuery {
  limit: number;
  offset: number;
}

// Socket Types
export interface SocketUser {
  id: number;
  username: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface SocketMessage {
  id?: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: MessageType;
  created_at?: Date;
  sender?: {
    id: number;
    username: string;
    name?: string;
    avatar?: string;
  };
}

export interface TypingEvent {
  conversation_id: number;
  user_id: number;
  username: string;
  is_typing: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Database Types
export interface DatabaseConfig {
  client: string;
  connection: {
    filename?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
  migrations: {
    directory: string;
  };
  seeds: {
    directory: string;
  };
  useNullAsDefault?: boolean;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: ValidationError[];
}

// Environment Types
export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;

  // Database
  DB_CLIENT: string;
  DB_FILENAME?: string;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // Security
  SESSION_SECRET: string;
  BCRYPT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE: string;

  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
}
