import { ISocketAuthenticated, io } from ".";
import { InvitesService } from "../services/InvitesService";

io.on("connection", (socket: ISocketAuthenticated) => {
  const invitesService = new InvitesService();
  const userID = socket.userID;

  socket.on("check_has_invites", async () => {
    const hasInvites = await invitesService.checkHasInvites(userID);

    socket.emit("new_invite_received", { hasNewInvites: hasInvites });
  });
});
