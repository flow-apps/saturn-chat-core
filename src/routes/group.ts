import { Router } from "express";
import multer from "multer";
import { configMulter } from "../configs/multer";
import { GroupsController } from "../controllers/GroupsController";
import { ParticipantsController } from "../controllers/ParticipantsController";
import { authProvider } from "../middlewares/authProvider";

const routes = Router();
const groupsController = new GroupsController();
const participantsController = new ParticipantsController();

routes.use(authProvider);

routes.post(
  "/groups",
  multer(configMulter(5)).single("group_avatar"),
  groupsController.create
);
routes.get("/group/:id", groupsController.index);
routes.get("/group/participants/new/:group_id", participantsController.new);
routes.get("/group/participants/list", participantsController.list);
routes.get("/group/participant/:group_id", participantsController.index);
routes.get("/group/participant/kick/:participant_id", participantsController.kick);
routes.get("/group/participant/ban/:participant_id", participantsController.ban);
routes.post("/group/participant/role/set/:participant_id", participantsController.setRole);
routes.delete("/group/participant/exit/:id", participantsController.delete)
routes.get("/groups/list", groupsController.list);
routes.get("/groups/search", groupsController.search);
routes.delete("/group/:id", groupsController.delete);
routes.patch("/group/:groupID", groupsController.update);
routes.patch(
  "/group/avatar/:groupID",
  multer(configMulter(5)).single("group_avatar"),
  groupsController.updateAvatar
);

export { routes as groupRoutes };
