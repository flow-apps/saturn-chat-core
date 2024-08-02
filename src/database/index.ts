import {
  Connection,
  createConnection,
  getConnection,
  getConnectionManager,
  getConnectionOptions,
} from "typeorm";

export default async (): Promise<Connection> => {
  let connection: Connection;

  if (!getConnectionManager().has("default")) {
    const connectionOptions = await getConnectionOptions();
    connection = await createConnection(connectionOptions).then((conn) => {
      console.log("Banco de dados conectado com sucesso");

      return conn;
    });
  } else {
    connection = getConnection();
  }

  await connection.runMigrations().then(() => {
    console.log("Migrações rodaram com sucesso!");
  });

  return connection;
};
