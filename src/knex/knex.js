const environment = process.env.APP_ENV || "development";
import knexfile from "../../knexfile.js";
const knexEnv = knexfile[environment];
import knex from "knex";

export default knex(knexEnv);
