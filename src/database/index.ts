import { Connection, createConnection, getConnectionOptions } from "typeorm";

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  const connection = await createConnection(
    Object.assign(defaultOptions, {
      database:
        process.env.NODE_ENV === "test"
          ? "flow_chat_test"
          : process.env.POSTGRES_DATABASE,
    })
  )

  await connection.runMigrations()
  return connection
};
