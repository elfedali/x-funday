import knex, { Knex } from 'knex';
import { config } from '@/config/env.js';

const environment = config.NODE_ENV || 'development';

let knexConfig: Knex.Config;

if (environment === 'development') {
  knexConfig = {
    client: 'sqlite3',
    connection: {
      filename: config.DB_FILENAME || './dev.sqlite',
    },
    migrations: {
      directory: './src/knex/migrations',
    },
    seeds: {
      directory: './src/knex/seeds',
    },
    useNullAsDefault: true,
  };
} else if (environment === 'test') {
  knexConfig = {
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    migrations: {
      directory: './src/knex/migrations',
    },
    seeds: {
      directory: './src/knex/seeds',
    },
    useNullAsDefault: true,
  };
} else {
  if (!config.DB_HOST || !config.DB_NAME || !config.DB_USER || !config.DB_PASSWORD) {
    throw new Error('Database configuration incomplete for production environment');
  }

  knexConfig = {
    client: config.DB_CLIENT || 'postgresql',
    connection: {
      host: config.DB_HOST,
      port: config.DB_PORT || 5432,
      database: config.DB_NAME,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
    },
    migrations: {
      directory: './src/knex/migrations',
    },
    seeds: {
      directory: './src/knex/seeds',
    },
  };
}

const db = knex(knexConfig);

export default db;
