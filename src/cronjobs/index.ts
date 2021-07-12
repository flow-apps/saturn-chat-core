import { removeExpiredInvitesTask } from "./invites";

function startTasks() {
  removeExpiredInvitesTask.start()

  console.log("Running all tasks");
}

export { startTasks }