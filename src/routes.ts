import { Router } from "express";
import multer from "multer";
import { configMulter } from "./configs/multer";
import { UsersController } from "./controllers/UsersController";
import { GroupsController } from "./controllers/GroupsController";
import { AuthController } from "./controllers/AuthController";
import { authProvider } from "./middlewares/authProvider";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter";
import { MessagesController } from "./controllers/MessagesController";
import { ParticipantsController } from "./controllers/ParticipantsController";

const routes = Router();
const usersController = new UsersController();
const groupsController = new GroupsController();
const authController = new AuthController();
const messageController = new MessagesController();
const participantsController = new ParticipantsController();

/*
 - USER ROUTES
*/

routes.post(
  "/users",
  multer(configMulter()).single("avatar"),
  usersController.create
);
routes.get("/users", authProvider, usersController.index);
routes.delete("/users", authProvider, usersController.delete);

routes.post(
  "/groups",
  authProvider,
  multer(configMulter()).single("group_avatar"),
  groupsController.create
);
routes.get("/group/:id", groupsController.index);
routes.get(
  "/group/participants/new/:group_id",
  authProvider,
  participantsController.new
);
routes.get(
  "/group/participants/list",
  authProvider,
  participantsController.list
);
routes.get(
  "/group/participant/:group_id",
  authProvider,
  participantsController.index
);
routes.get("/groups/list", authProvider, groupsController.list);
routes.get("/groups/search", authProvider, groupsController.search);
routes.delete("/group/:id", authProvider, groupsController.delete);

routes.post("/auth", rateLimiterMiddleware, authController.authenticate);

routes.get("/messages/:groupID", authProvider, messageController.list);
routes.post(
  "/messages/SendAttachment/:groupID",
  authProvider,
  multer(configMulter(120, ["*/*"])).array("attachment"),
  messageController.createAttachment
);

export { routes };
