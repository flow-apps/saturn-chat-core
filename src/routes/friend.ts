import { Router } from "express";
import { FriendsController } from "../controllers/FriendsController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const friendsController = new FriendsController()

routes.use(authProvider)

routes.get("/friends", friendsController.list)
routes.post("/friends/request", friendsController.request)
routes.put("/friends/response", friendsController.response)

export { routes as friendRoutes }
