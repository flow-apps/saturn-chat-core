import compression from "compression";
import express from "express";
import "express-async-errors";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import createConnection from "./database";
import { fakePoweredBy } from "./middlewares/fakePoweredBy";
import { handlerError } from "./middlewares/handlerError";
import { routes } from "./routes";

createConnection();
const app = express();
const http = createServer(app);

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

export { http };
