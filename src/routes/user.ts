import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { UsersController } from "../controllers/UsersController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const usersController = new UsersController();

routes.post("/users",
  multer(configMulter(5)).single("avatar"),
  usersController.create
);
routes.get("/users", authProvider, usersController.index);
routes.delete("/users", authProvider, usersController.delete);

export { routes as userRoutes };
