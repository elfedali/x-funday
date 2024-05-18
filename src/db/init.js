import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function initializeDb() {
  const db = await open({
    filename: "./db.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT NULL,
        bio TEXT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP 
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_id ON users (id);
    CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users (username);
    CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email);

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS messages_id ON messages (id);

    CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS rooms_id ON rooms (id);

    CREATE TABLE IF NOT EXISTS room_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS room_users_id ON room_users (id);

    CREATE TABLE IF NOT EXISTS room_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        message_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS room_messages_id ON room_messages (id);
  `);

  return db;
}
