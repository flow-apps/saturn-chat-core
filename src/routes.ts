import { Router } from "express";
import { UsersController } from "./controllers/UsersController";
import multer from "multer";
import { configMulter } from "./configs/multer";
import { GroupsController } from "./controllers/GroupsController";

const routes = Router();
const usersController = new UsersController();
const groupsController = new GroupsController();

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

routes.post("/groups", groupsController.create);
routes.get("/groups/:id", groupsController.index);

export { routes };
