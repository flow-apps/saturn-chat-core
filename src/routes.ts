import { Router } from "express";
import { UsersController } from "./controllers/UsersController";
import multer from "multer";
import { configMulter } from "./configs/multer";

const routes = Router();
const usersController = new UsersController();

routes.post(
  "/api/users",
  multer(configMulter()).single("avatar"),
  usersController.create
);

routes.get("/api/users/:id", usersController.index);
routes.delete("/api/users/:id", usersController.delete);

export { routes };
