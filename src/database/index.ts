import { Connection, createConnection, getConnectionOptions } from "typeorm";

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  const connection = await createConnection(defaultOptions).then(
    async (conn) => {
      await conn.runMigrations().then(() => {
        console.log("Migrações rodadas com sucesso!");
      });

      return conn;
    }
  );
  return connection;
};
