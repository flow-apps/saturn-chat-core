import { Router } from "express";
import { InvitesController } from "../controllers/InvitesController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const invitesController = new InvitesController()

routes.use(authProvider);
routes.post("/invites", invitesController.create)

export { routes as inviteRoutes };
