import { Socket } from 'socket.io';
import { JwtUser } from './index.js';

declare module 'socket.io' {
  interface Socket {
    user?: JwtUser;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      PORT: string;

      // Database
      DB_CLIENT: string;
      DB_FILENAME?: string;
      DB_HOST?: string;
      DB_PORT?: string;
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;

      // JWT
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;

      // Security
      SESSION_SECRET: string;
      BCRYPT_ROUNDS: string;
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;

      // File Upload
      MAX_FILE_SIZE: string;
      UPLOAD_PATH: string;

      // Logging
      LOG_LEVEL: string;
      LOG_FILE: string;

      // Email
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      SMTP_FROM?: string;
    }
  }
}

export {};
