import { getCustomRepository } from "typeorm";
import { io, ISocketAuthenticated } from ".";
import { ParticipantStatus } from "../database/enums/participants";
import { Participant } from "../entities/Participant";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { ParticipantsService } from "../services/ParticipantsService";


io.on("connection", (socket: ISocketAuthenticated) => {
  const participantsRepository = getCustomRepository(ParticipantsRepository)
  const participants = new ParticipantsService()

  const userID = socket.userID
  let participant: Participant;

  socket.on("connect_in_chat", async (id: string) => {
    await socket.join(id);
    participant = await participants.index(socket.userID, id);

    if (participant) {
      await participantsRepository.update(participant.id, {
        status: ParticipantStatus.ONLINE,
      });
    }

    socket.in(id).emit("new_user_online", userID);
    console.log(`Socket ${socket.id} conectado no grupo ${id}`);
  });

  socket.on("leave_chat", async () => {
    if (participant) {
      participantsRepository.update(participant.id, {
        status: ParticipantStatus.OFFLINE,
      });
    }

    socket.in(participant.group_id).emit("new_user_offline", userID);
  });

  socket.on("exit_group", async (participantID: string) => {
    await participants.exit(participantID);

    socket.emit("complete_exit_group");
  });
});
