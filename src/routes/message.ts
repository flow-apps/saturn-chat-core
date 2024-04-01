import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { authProvider } from "../middlewares/authProvider";
import { MessagesController } from "../controllers/MessagesController";
import { validatePremium } from "../middlewares/validatePremium";
import { FirebaseAdmin } from "../configs/firebase";

const routes = Router();
const messageController = new MessagesController();
const maxFileSizePremium = FirebaseAdmin.remoteConfig()
  .getTemplate()
  .then((configs: any) => {    
    return Number(configs.parameters.premium_file_upload.defaultValue.value);
  }) as any as number;

routes.get("/messages/:groupID", authProvider, messageController.list);
routes.post(
  "/messages/SendAttachment/:groupID",
  authProvider,
  validatePremium,
  multer(configMulter(maxFileSizePremium, ["*/*"])).array("attachment"),
  messageController.createAttachment
);

export { routes as messageRoutes };
