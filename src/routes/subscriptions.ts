import { Router } from "express";
import { authProvider } from "../middlewares/authProvider";
import { SubscriptionsController } from "../controllers/SubscriptionsController";

const routes = Router();
const subscriptionsController = new SubscriptionsController()

routes.get("/subscriptions", subscriptionsController.get)


export { routes as subscriptionsRoutes }
