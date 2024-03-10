import { Router } from "express";
import { AppController } from "../controllers/AppController";

const routes = Router();
const appController = new AppController()

routes.get("/ping", (req, res) => res.status(200).send("pong"))

export { routes as appRoutes }
