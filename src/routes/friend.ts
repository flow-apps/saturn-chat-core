import { Router } from "express";
import { FriendsController } from "../controllers/FriendsController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const friendsController = new FriendsController()

routes.use(authProvider)

routes.get("/friends", friendsController.list)
routes.post("/friends/request", friendsController.request)
routes.put("/friends/response", friendsController.response)
routes.delete("/friends/remove/:friend_id", friendsController.remove)
routes.get("/friends/groups/invite", friendsController.friendsToInvite)
routes.post("/friends/groups/invite", friendsController.sendGroupInviteToFriend)

export { routes as friendRoutes }
