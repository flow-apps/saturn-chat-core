import { Router } from "express";
import { InvitesController } from "../controllers/InvitesController";
import { authProvider } from "../middlewares/authProvider";
import { redisCache } from "../middlewares/redisCache";

const routes = Router();
const invitesController = new InvitesController();

routes.get("/invites/:inviteID", redisCache.route(60), invitesController.get);
routes.post("/invites", authProvider, invitesController.create);
routes.get("/invites/list/:groupID", authProvider, invitesController.list);
routes.get("/inv/join/:inviteID", authProvider, invitesController.join);
routes.get("/invites/requests", authProvider, invitesController.listRequests);
routes.delete("/invites/:inviteID", authProvider, invitesController.delete);

export { routes as inviteRoutes };
