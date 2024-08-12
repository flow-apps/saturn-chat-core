import "dotenv/config";
import path = require("path");
import { ConnectionOptions } from "typeorm";

export const ORMConfig = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  logging: false,
  migrationsTransactionMode: "each",
  entities: [path.join(__dirname, process.env.TYPEORM_ENTITIES_PATH)],
  migrations: [path.join(__dirname, process.env.TYPEORM_MIGRATIONS_PATH)],
  cli: {
    entitiesDir: process.env.TYPEORM_ENTITIES_CLI_PATH,
    migrationsDir: process.env.TYPEORM_MIGRATIONS_CLI_PATH,
  },
} as any as ConnectionOptions;

export default ORMConfig;
