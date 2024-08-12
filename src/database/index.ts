import { Connection, createConnection } from "typeorm";
import ORMConfig from "../../ormconfig";

export default async (): Promise<Connection> => {
  const defaultOptions = ORMConfig;

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
