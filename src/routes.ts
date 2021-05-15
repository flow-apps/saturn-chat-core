import { Router } from "express";
import { UsersController } from "./controllers/UsersController";
import multer from "multer";
import { configMulter } from "./configs/multer";

const routes = Router();
const usersController = new UsersController();

routes.post(
  "/users",
  multer(configMulter()).single("avatar"),
  usersController.create
);

routes.get("/users/:id", usersController.index);
routes.delete("/users/:id", usersController.delete);

export { routes };
