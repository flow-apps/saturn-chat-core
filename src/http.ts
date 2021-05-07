import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { routes } from "./routes";
import "reflect-metadata";
import { createConnection } from "typeorm";

const app = express();
const http = createServer(app);
const io = new Server(http);
createConnection();

app.use(helmet());
app.use((req, res, next) => {
  res.set("X-Powered-By", "PHP/5.4.37");
  next();
});
app.use(express.json());
app.use(routes);

io.on("connection", (socket: Socket) => {
  console.log("Novo socket conectado: ", socket.id);
});

export { http, io };
