import { initializeDb } from "../db/init.js";
const db = await initializeDb();
export const getUserByUsername = async (username) => {
  return await db.get("SELECT * FROM users WHERE username = ?", username);
};

export const getUserById = async (id) => {
  return await db.get("SELECT * FROM users WHERE id = ?", id);
};

export const createUser = async (username, email, hashedPassword) => {
  await db.run(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    username,
    email,
    hashedPassword
  );
};
