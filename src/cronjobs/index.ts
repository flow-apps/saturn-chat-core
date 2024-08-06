import { removeExpiredInvitesTask } from "./invites";
import { updateSubcriptionsTask } from "./subscriptions";

function startTasks() {
  // removeExpiredInvitesTask.start();
  updateSubcriptionsTask.start();

  console.log("Todas as tasks estão rodando");
}

export { startTasks }