import { Router } from "express";
import { InvitesController } from "../controllers/InvitesController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const invitesController = new InvitesController()

routes.post("/invites", authProvider, invitesController.create)
routes.get("/invites/list/:groupID", authProvider, invitesController.list)
routes.get("/invites/:inviteID", invitesController.get)
routes.get("/inv/join/:inviteID", authProvider, invitesController.join)
routes.delete("/invites/:inviteID", authProvider, invitesController.delete)

export { routes as inviteRoutes };
