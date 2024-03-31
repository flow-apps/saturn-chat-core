import { Router } from "express";
import { authProvider } from "../middlewares/authProvider";
import { SubscriptionsController } from "../controllers/SubscriptionsController";
import { validatePremium } from "../middlewares/validatePremium";

const routes = Router();
const subscriptionsController = new SubscriptionsController();

routes.get("/subscriptions", authProvider, subscriptionsController.get);
routes.get(
  "/subscriptions/validate",
  authProvider,
  validatePremium,
  subscriptionsController.isActive
);
routes.post("/subscriptions", authProvider, subscriptionsController.register);

export { routes as subscriptionsRoutes };
