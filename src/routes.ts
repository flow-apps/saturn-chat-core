import { Router } from "express";
import multer from "multer";
import { configMulter } from "./configs/multer";
import { UsersController } from "./controllers/UsersController";
import { GroupsController } from "./controllers/GroupsController";
import { AuthController } from "./controllers/AuthController";
import { authProvider } from "./middlewares/authProvider";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter";
import { MessagesController } from "./controllers/MessagesController";

const routes = Router();
const usersController = new UsersController();
const groupsController = new GroupsController();
const authController = new AuthController();
const messageController = new MessagesController();

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

/*
 - GROUP ROUTES
*/

routes.post(
  "/groups",
  authProvider,
  multer(configMulter()).single("group_avatar"),
  groupsController.create
);
routes.get("/group/:id", groupsController.index);
routes.get("/groups/list", authProvider, groupsController.list);
routes.delete("/group/:id", authProvider, groupsController.delete);

/*
 - AUTH ROUTES
*/

routes.post("/auth", rateLimiterMiddleware, authController.authenticate);

/*
  - MESSAGE ROUTES
*/

routes.get("/messages/:groupID", authProvider, messageController.list);

export { routes };
