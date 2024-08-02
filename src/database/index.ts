import {
  Connection,
  createConnection,
  getConnectionOptions,
  getConnection,
  ConnectionNotFoundError,
} from "typeorm";

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  try {
    let connection = getConnection();

    if (!connection.isConnected) {
      connection = await createConnection(defaultOptions);

      console.log("Conexão com banco de dados estabelecida");
    }

    await connection.runMigrations().then(() => {
      console.log("Migrações rodadas com sucesso!");
    });

    return connection;
  } catch (error) {
    const connection = await createConnection(defaultOptions);

    console.log("Conexão com banco de dados estabelecida");
    await connection.runMigrations().then(() => {
      console.log("Migrações rodadas com sucesso!");
    });
    return connection;
  }
};
