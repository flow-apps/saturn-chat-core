import "express-async-errors";
import { createServer } from "http";
import { fakePoweredBy } from "./middlewares/fakePoweredBy";
import { handlerError } from "./middlewares/handlerError";
import { userRoutes } from "./routes/user";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";
import { authRoutes } from "./routes/auth";
import { inviteRoutes } from "./routes/invite";
import { startTasks } from "./cronjobs";
import { appRoutes } from "./routes/app";
import { friendRoutes } from "./routes/friend";
import createConnection from "./database";
import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cors from "cors";
import { subscriptionsRoutes } from "./routes/subscriptions";

process.on("unhandledRejection", console.error);
createConnection();
startTasks();

const app = express();
const http = createServer(app);

app.use(morgan("dev"));
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(fakePoweredBy);
app.use(compression({ level: 9 }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads", "files"))
);

app.use(appRoutes);
app.use(inviteRoutes);
app.use(authRoutes);
app.use(userRoutes);
app.use(groupRoutes);
app.use(messageRoutes);
app.use(friendRoutes);
app.use(subscriptionsRoutes);
app.use(handlerError);

export { http };
