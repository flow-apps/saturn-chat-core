import {
  Connection,
  createConnection,
  getConnectionOptions,
} from "typeorm";

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  const connection = await createConnection(defaultOptions);
  await connection.runMigrations().then(() => {
    console.log("Migrações rodadas com sucesso!");
  });
  return connection;
};
