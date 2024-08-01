import "dotenv/config";
import "reflect-metadata";
import "./websockets/group";
import "./websockets/message";
import "./websockets/app";
import { http } from "./http";
import os from "os";
import cluster from "cluster";

const totalCPUs = os.availableParallelism();

if (cluster.isPrimary) {
  console.log(`[ Cluster ] ${totalCPUs} theads disponíveis`);
  console.log(`[ Cluster ] processo ${process.pid}`);

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`[ Cluster ] worker ${worker.process.pid} parou`);
    console.log("[ Cluster ] criando novo worker");
    cluster.fork();
  });
} else {
  http.listen(process.env.PORT || 3000, () =>
    console.log(`Server started in port ${process.env.PORT || 3000} in process ${process.pid}`)
  );
}
