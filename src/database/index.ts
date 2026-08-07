import { Connection, createConnection, getConnectionOptions } from "typeorm";

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  const connection = await createConnection(defaultOptions).then(
    async (conn) => {
      await conn.synchronize().then(() => {
        console.log("Migrações rodadas com sucesso!");
      });

      return conn;
    }
  );
  return connection;
};
