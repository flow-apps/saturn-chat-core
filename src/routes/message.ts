import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { authProvider } from "../middlewares/authProvider";
import { MessagesController } from "../controllers/MessagesController";
import { validatePremium } from "../middlewares/validatePremium";
import { remoteConfigs } from "../configs/remoteConfigs";

const routes = Router();
const messageController = new MessagesController();
const maxFileSizePremium = Number(remoteConfigs.premium_file_upload);

routes.get("/messages/:groupID", authProvider, messageController.list);
routes.post(
  "/messages/SendAttachment/:groupID",
  authProvider,
  validatePremium,
  multer(configMulter(maxFileSizePremium, ["*/*"])).array("attachment"),
  messageController.createAttachment
);

export { routes as messageRoutes };
