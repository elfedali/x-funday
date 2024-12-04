// Usage: import env from './helpers/env.js';
import "dotenv/config";

export default {
  //app
  APP_NAME: process.env.APP_NAME || "Real time chat",
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  APP_VERSION: process.env.APP_VERSION || "1.0.0",
  API_URL: process.env.API_URL,
  APP_CLIENT: process.env.APP_CLIENT,

  // jwt
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRED: process.env.JWT_EXPIRED,
};
