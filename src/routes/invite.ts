import { Router } from "express";
import { InvitesController } from "../controllers/InvitesController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const invitesController = new InvitesController();

routes.get("/invites/requests", authProvider, invitesController.listRequests);
routes.post("/invites", authProvider, invitesController.create);
routes.get("/invites/list/:groupID", authProvider, invitesController.list);
routes.get("/inv/join/:inviteID", authProvider, invitesController.join);
routes.get("/invites/:inviteID", invitesController.get);
routes.delete("/invites/:inviteID", authProvider, invitesController.delete);

export { routes as inviteRoutes };
