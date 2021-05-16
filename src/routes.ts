import { Router } from "express";
import multer from "multer";
import { configMulter } from "./configs/multer";
import { UsersController } from "./controllers/UsersController";
import { GroupsController } from "./controllers/GroupsController";
import { AuthController } from "./controllers/AuthController";

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
routes.get("/users/:id", usersController.index);
routes.delete("/users/:id", usersController.delete);

/*
 - GROUP ROUTES
*/

routes.post(
  "/groups",
  multer(configMulter()).single("group_avatar"),
  groupsController.create
);
routes.get("/groups/:id", groupsController.index);
routes.delete("/groups/:id", groupsController.delete);

/*
 - AUTH ROUTES
*/

routes.post("/auth", authController.authenticate);

export { routes };
