import { Router } from "express";
import multer from "multer";
import { configMulter } from "./configs/multer";
import { UsersController } from "./controllers/UsersController";
import { GroupsController } from "./controllers/GroupsController";
import { AuthController } from "./controllers/AuthController";
import { authProvider } from "./middlewares/authProvider";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter";

const routes = Router();
const usersController = new UsersController();
const groupsController = new GroupsController();
const authController = new AuthController();

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
routes.get("/groups/:id", groupsController.index);
routes.delete("/groups/:id", authProvider, groupsController.delete);

/*
 - AUTH ROUTES
*/

routes.post("/auth", rateLimiterMiddleware, authController.authenticate);

export { routes };
