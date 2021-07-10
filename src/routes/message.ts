import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { authProvider } from "../middlewares/authProvider";
import { MessagesController } from "../controllers/MessagesController";

const routes = Router();
const messageController = new MessagesController();

routes.use(authProvider)

routes.get("/messages/:groupID", messageController.list);
routes.post("/messages/SendAttachment/:groupID",
  multer(configMulter(120, ["*/*"])).array("attachment"),
  messageController.createAttachment
);

export { routes as messageRoutes };

