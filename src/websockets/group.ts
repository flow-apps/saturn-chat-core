import { getCustomRepository } from "typeorm";
import { io, ISocketAuthenticated } from ".";
import { ParticipantStatus } from "../database/enums/participants";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { ParticipantsService } from "../services/ParticipantsService";
import { CacheService } from "../services/CacheService";

io.on("connection", (socket: ISocketAuthenticated) => {
  const participantsRepository = getCustomRepository(ParticipantsRepository);
  const participants = new ParticipantsService();
  const cacheService = new CacheService();

  const userID = socket.userID;

  socket.on("connect_in_chat", async (id: string) => {

    console.log(`Socket ${socket.id} conectando no grupo ${id}`);

    await socket.join(id);
    const participant = await participants.index(socket.userID, id);

    if (participant) {
      await participantsRepository.update(participant.id, {
        status: ParticipantStatus.ONLINE,
      });
    }

    await cacheService.set(`room_user_${userID}`, {
      participant_id: participant.id,
      group_id: id,
      socket_id: socket.id,
    });

    socket.in(id).emit("new_user_online", userID);
    socket.emit("success_join", id);
    console.log(`Socket ${socket.id} conectado no grupo ${id}`);
  });

  socket.on("leave_chat", async () => {
    const cachedData = await cacheService.get(`room_user_${userID}`);

    if (!cachedData) return;

    const data = JSON.parse(cachedData);

    console.log(
      `[ Websocket ] desconectando socket ${data.socket_id} do grupo ${data.group_id}`
    );

    participantsRepository.update(data.participant_id, {
      status: ParticipantStatus.OFFLINE,
    });
    await cacheService.delete(`room_user_${userID}`);
    socket.in(data.group_id).emit("new_user_offline", userID);
    socket.emit("success_leave", data.group_id);
  });

  socket.on("exit_group", async (participantID: string) => {
    await participants.exit(participantID);

    socket.emit("complete_exit_group");
  });

  socket.on("disconnect", async () => {
    const cachedData = await cacheService.get(`room_user_${userID}`);

    if (!cachedData) return;

    const data = JSON.parse(cachedData);

    if (data.participant_id) {
      participantsRepository.update(data.participant_id, {
        status: ParticipantStatus.OFFLINE,
      });
    }

    await cacheService.delete(`room_user_${userID}`);
  });
});
