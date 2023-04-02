import { Router } from "express";
import { FriendsController } from "../controllers/FriendsController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const friendsController = new FriendsController()

routes.get("/friends", authProvider, friendsController.list)
routes.post("/friends/request", authProvider, friendsController.request)
routes.put("/friends/response", authProvider, friendsController.response)
routes.delete("/friends/remove/:friend_id", authProvider, friendsController.remove)
routes.get("/friends/groups/invite", authProvider, friendsController.friendsToInvite)
routes.post("/friends/groups/invite", authProvider, friendsController.sendGroupInviteToFriend)

export { routes as friendRoutes }
