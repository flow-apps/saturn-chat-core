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

http.listen(Number(process.env.PORT) || 3000, () =>
  console.log(
    `Servidor iniciado na porta ${process.env.PORT || 3000} no processo ${
      process.pid
    }`,
  ),
);
