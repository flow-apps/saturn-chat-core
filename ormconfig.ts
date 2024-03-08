require("dotenv").config();

module.exports = {
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: true,
  migrationsRun: true,
  logging: false,
  entities: [process.env.TYPEORM_ENTITIES_PATH],
  migrations: [process.env.TYPEORM_MIGRATIONS_PATH],
  cli: {
    entitiesDir: process.env.TYPEORM_ENTITIES_CLI_PATH,
    migrationsDir: process.env.TYPEORM_MIGRATIONS_CLI_PATH,
  },
  autoSchemaSync: true
};
