import { Router } from "express";
import { AppController } from "../controllers/AppController";

const routes = Router();
const appController = new AppController()

export { routes as appRoutes }
