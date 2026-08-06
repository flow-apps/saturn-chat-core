import "dotenv/config";
import "reflect-metadata";
import createConnection from "./src/database";
import { StorageManager } from "./src/services/StorageManager";

async function runMigration() {
  try {
    console.log("Iniciando conexão com o banco de dados...");
    await createConnection();
    console.log("Conexão com o banco de dados estabelecida.");

    console.log("Inicializando o StorageManager e começando a migração...");
    await StorageManager.migrateToAzure();

    console.log("Processo de migração concluído com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("A migração falhou:", error);
    process.exit(1);
  }
}

runMigration();