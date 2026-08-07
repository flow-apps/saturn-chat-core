import { Router } from "express";
import { AppController } from "../controllers/AppController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const appController = new AppController();

routes.get("/ping", (req, res) => res.status(200).send("Hello World!"));
routes.get("/files/:fileId", appController.downloadFile.bind(appController));
routes.get("/files/:fileId/access-url", appController.getFileAccessUrl.bind(appController));
routes.get("/explorer/search/:term", authProvider, appController.search);

export { routes as appRoutes };
