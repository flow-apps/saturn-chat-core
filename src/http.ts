import "express-async-errors";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import { routes } from "./routes";
import { createConnection } from "typeorm";
import { fakePoweredBy } from "./middlewares/fakePoweredBy";
import { handlerError } from "./middlewares/handlerError";
import compression from "compression";
import path from "path";

const app = express();
const http = createServer(app);
const io = new Server(http);
createConnection().then(() => console.log("Conectado ao banco!"));

app.use(helmet());
app.use(fakePoweredBy);
app.use(compression({ level: 9 }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads", "files"))
);
app.use(routes);
app.use(handlerError);

export { http, io };
