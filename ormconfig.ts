require("dotenv").config();

const path = require("path");

module.exports = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  logging: false,
  migrationsTransactionMode: 'each',
  entities: [path.join(__dirname, process.env.TYPEORM_ENTITIES_PATH)],
  migrations: [path.join(__dirname, process.env.TYPEORM_MIGRATIONS_PATH)],
  cli: {
    entitiesDir: process.env.TYPEORM_ENTITIES_CLI_PATH,
    migrationsDir: process.env.TYPEORM_MIGRATIONS_CLI_PATH,
  },
};
