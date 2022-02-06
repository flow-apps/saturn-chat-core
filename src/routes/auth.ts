import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authProvider } from "../middlewares/authProvider";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";

const routes = Router();
const authController = new AuthController();

routes.post("/auth", rateLimiterMiddleware, authController.authenticate);
routes.patch(
  "/auth/password/switch",
  rateLimiterMiddleware,
  authProvider,
  authController.switchPassword
);

export { routes as authRoutes };
