import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";

const routes = Router()
const authController = new AuthController();

routes.post("/auth", rateLimiterMiddleware, authController.authenticate);

export { routes as authRoutes };
