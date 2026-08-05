require("dotenv/config");
require("ts-node/register/transpile-only");

const { execSync } = require("child_process");
const path = require("path");

const entitiesPath = process.env.TYPEORM_ENTITIES_PATH || "./src/entities/*.ts";
const migrationsPath = process.env.TYPEORM_MIGRATIONS_PATH || "./src/database/migrations/*.ts";
const entitiesCliPath = process.env.TYPEORM_ENTITIES_CLI_PATH || "./src/entities/*.ts";
const migrationsCliPath = process.env.TYPEORM_MIGRATIONS_CLI_PATH || "./src/database/migrations/*.ts";

const globalNodeModulesPath = execSync("npm root -g", { encoding: "utf8" }).trim();
const { DataSource } = require(path.join(globalNodeModulesPath, "typeorm"));

const dataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  logging: false,
  migrationsTransactionMode: "each",
  entities: [path.join(__dirname, entitiesPath)],
  migrations: [path.join(__dirname, migrationsPath)],
});

dataSource.cli = {
  entitiesDir: entitiesCliPath,
  migrationsDir: migrationsCliPath,
};

module.exports = dataSource;