import { Connection, createConnection, getConnectionOptions } from "typeorm";

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();
  const database = {
    development: process.env.POSTGRES_DATABASE_DEV,
    prod: process.env.POSTGRES_DATABASE_PROD,
    test: process.env.POSTGRES_DATABASE_TEST,
  };

  const connection = await createConnection(
    Object.assign(defaultOptions, {
      database: database[process.env.NODE_ENV],
    })
  );

  await connection.runMigrations();
  return connection;
};
