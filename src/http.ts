import "reflect-metadata";
import "express-async-errors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { routes } from "./routes";
import { createConnection } from "typeorm";
import { AppError } from "./errors/AppError";

const app = express();
const http = createServer(app);
const io = new Server(http);
createConnection();

app.use(helmet());
app.use(express.json());
app.use((req, res, next) => {
  res.set("X-Powered-By", "PHP/5.4.37");
  next();
});
app.use(routes);
app.use(
  (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      status: "Server error",
      message: `Internal server erro ${err.message}`,
    });
  }
);

io.on("connection", (socket: Socket) => {
  console.log("Novo socket conectado: ", socket.id);
});

export { http, io };
