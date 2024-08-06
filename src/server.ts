import "dotenv/config";
import "reflect-metadata";
import "./websockets/group";
import "./websockets/message";
import "./websockets/app";
import { http } from "./http";
import os from "os";
import cluster from "cluster";

const availableCPUs = os.availableParallelism();
console.log(`${availableCPUs} CPUs dispoíveis`);


if (cluster.isPrimary && availableCPUs > 1) {
  console.log(`Process primário ${process.pid} está ativo`);

  for (let i = 0; i < availableCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Processo ${worker.process.pid} caiu. Reiniciando...`);
    cluster.fork();
  });
} else {
  http.listen(process.env.PORT || 3000, () =>
    console.log(
      `Servidor iniciado na porta ${process.env.PORT || 3000} no processo ${
        process.pid
      }`
    )
  );
}
