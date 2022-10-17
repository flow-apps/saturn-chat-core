import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { NotificationsController } from "../controllers/NotificationsController";
import { UsersController } from "../controllers/UsersController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const usersController = new UsersController();
const notificationsController = new NotificationsController();

routes.post(
  "/users",
  multer(configMulter(5)).single("avatar"),
  usersController.create
);
routes.get("/users", authProvider, usersController.index);
routes.get("/users/@me", authProvider, usersController.me);
routes.delete("/users", authProvider, usersController.delete);
routes.patch("/users/update", authProvider, usersController.update);
routes.patch(
  "/users/update/avatar",
  authProvider,
  multer(configMulter(5)).single("avatar"),
  usersController.updateAvatar
);
routes.post(
  "/users/notify/register",
  authProvider,
  notificationsController.register
);
routes.patch(
  "/users/notify/toggle/",
  authProvider,
  notificationsController.toggle
);
routes.delete(
  "/users/notify/unregister",
  authProvider,
  notificationsController.unregister
);

export { routes as userRoutes };
