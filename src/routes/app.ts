import { Router } from "express";
import { AppController } from "../controllers/AppController";

const routes = Router();
const appController = new AppController()

routes.get("/app/configs", appController.getConfigs)

export { routes as appRoutes }
