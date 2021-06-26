import { io, ISocketAuthenticated } from ".";
import { ParticipantsService } from "../services/ParticipantsService";

io.on("connection", (socket: ISocketAuthenticated) => {
  const participants = new ParticipantsService();

  socket.on("exit_group", async (participantID: string) => {
    await participants.exit(participantID);

    socket.emit("complete_exit_group");
  });
});
