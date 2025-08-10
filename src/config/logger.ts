import winston from 'winston';
import { config } from './env.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
import fs from 'fs';
const logsDir = path.dirname(path.resolve(config.LOG_FILE));
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  defaultMeta: { service: 'prochat-api' },
  transports: [
    // File transport
    new winston.transports.File({
      filename: config.LOG_FILE,
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Error file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (config.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Export a stream interface for morgan
export const logStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};
