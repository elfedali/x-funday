import knex from "../knex/knex.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
const table = "users";
const SALT_ROUNDS = 10;
const fields = [
  "id",
  "username",
  "name",
  "email",
  "password",
  "avatar",
  "bio",
  "is_admin",
  "is_active",
  "verify_token",
  "is_verified",

  "created_at",
  "updated_at",
];

const HiddenFields = ["password", "verify_token"];

const hashPassword = (password) => bcrypt.hashSync(password, SALT_ROUNDS);
export const comparePassword = (password, hash) =>
  bcrypt.compareSync(password, hash);
const beforeSave = (user) => {
  if (user.password) {
    user.password = hashPassword(user.password);
  }
  user.verify_token = generateToken();
  user.is_active = true;
  user.is_verified = true;

  return user;
};

export const getAllUsers = async () => {
  return await knex(table).select(fields);
};
export const getUserByUsername = async (username) => {
  return await knex(table).select(fields).where("username", username).first();
};

export const getUserById = async (id) => {
  return await knex(table).select(fields).where("id", id).first();
};

export const createUser = async (props) => {
  return await knex(table).insert(beforeSave(props)).returning(fields);
};

export const updateUser = async (id, fields) => {
  return await knex(table).where("id", id).update(fields).returning("*");
};

export const deleteUser = async (id) => {
  return await knex(table).where("id", id).del();
};

const generateToken = (length = 30) =>
  crypto.randomBytes(length).toString("hex");
