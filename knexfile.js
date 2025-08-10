// Update with your config settings.
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
  development: {
    client: "sqlite3",
    connection: {
      filename: process.env.DB_FILENAME || "./dev.sqlite",
    },
    migrations: {
      directory: `${__dirname}/src/knex/migrations`,
    },
    seeds: {
      directory: `${__dirname}/src/knex/seeds`,
    },
    useNullAsDefault: true,
  },

  test: {
    client: "sqlite3",
    connection: {
      filename: ":memory:",
    },
    migrations: {
      directory: `${__dirname}/src/knex/migrations`,
    },
    seeds: {
      directory: `${__dirname}/src/knex/seeds`,
    },
    useNullAsDefault: true,
  },

  production: {
    client: process.env.DB_CLIENT || "postgresql",
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: `${__dirname}/src/knex/migrations`,
      tableName: "knex_migrations",
    },
    seeds: {
      directory: `${__dirname}/src/knex/seeds`,
    },
  },

  staging: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },

  production: {
    client: "postgresql",
    connection: {
      database: "my_db",
      user: "username",
      password: "password",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};
