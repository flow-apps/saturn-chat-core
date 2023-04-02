import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { authProvider } from "../middlewares/authProvider";
import { MessagesController } from "../controllers/MessagesController";

const routes = Router();
const messageController = new MessagesController();

routes.get("/messages/:groupID", authProvider, messageController.list);
routes.post("/messages/SendAttachment/:groupID", authProvider,
  multer(configMulter(120, ["*/*"])).array("attachment"),
  messageController.createAttachment
);

export { routes as messageRoutes };

