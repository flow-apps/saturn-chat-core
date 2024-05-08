import { removeExpiredInvitesTask } from "./invites";
import { updateSubcriptionsTask } from "./subscriptions";

function startTasks() {
  // removeExpiredInvitesTask.start();
  updateSubcriptionsTask.start();

  console.log("Running all tasks");
}

export { startTasks }