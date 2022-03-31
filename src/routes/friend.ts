import { Router } from "express";
import { FriendsController } from "../controllers/FriendsController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const friendsController = new FriendsController()

routes.use(authProvider)

routes.post("/friends", friendsController.request)

export { routes as friendRoutes }
