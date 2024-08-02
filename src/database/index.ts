import { Connection, createConnection, getConnectionOptions } from "typeorm";

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();
  const database = {
    development: process.env.POSTGRES_DATABASE,
    prod: process.env.POSTGRES_DATABASE,
    test: "saturn_chat_test",
  };

  console.log("[Banco de Dados] conectando ao banco:", database[process.env.NODE_ENV]);
  

  const connection = await createConnection(
    Object.assign(defaultOptions, {
      database: database[process.env.NODE_ENV],
    })
  );

  console.log("Conexão com banco de dados estabelecida");
  

  await connection.runMigrations()
  return connection
};
