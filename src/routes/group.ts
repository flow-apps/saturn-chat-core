import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { GroupsController } from "../controllers/GroupsController";
import { ParticipantsController } from "../controllers/ParticipantsController";
import { authProvider } from "../middlewares/authProvider";
import { validatePremium } from "../middlewares/validatePremium";

const routes = Router();
const groupsController = new GroupsController();
const participantsController = new ParticipantsController();

routes.post(
  "/groups",
  authProvider,
  validatePremium,
  multer(configMulter(5)).single("group_avatar"),
  groupsController.create
);
routes.get("/group/:id", authProvider, groupsController.index);
routes.get("/group/participants/new/:group_id", authProvider, participantsController.new);
routes.get("/group/participants/list", authProvider, participantsController.list);
routes.get("/group/participant/:group_id", authProvider, participantsController.index);
routes.get("/group/participant/kick/:participant_id", authProvider, participantsController.kick);
routes.get("/group/participant/ban/:participant_id", authProvider, participantsController.ban);
routes.post("/group/participant/role/set/:participant_id", authProvider, participantsController.setRole);
routes.delete("/group/participant/exit/:id", authProvider, participantsController.delete)
routes.get("/groups/list", authProvider, groupsController.list);
routes.get("/groups/search", authProvider, groupsController.search);
routes.delete("/group/:id", authProvider, groupsController.delete);
routes.patch("/group/:groupID", authProvider, groupsController.update);
routes.patch(
  "/group/avatar/:groupID",
  authProvider,
  multer(configMulter(5)).single("group_avatar"),
  groupsController.updateAvatar
);

export { routes as groupRoutes };
