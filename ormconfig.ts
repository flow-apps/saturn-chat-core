require("dotenv").config();

export default {

  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: false,
  migrationsRun: true,
  logging: false,
  entities: ["src/entities/**/*{.ts, .js}"],
  migrations: ["src/database/migrations/**/*{.ts, .js}"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/database/migrations",
  },
  autoSchemaSync: true
};
