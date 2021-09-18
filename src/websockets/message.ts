import { getCustomRepository } from "typeorm";
import { io, ISocketAuthenticated } from ".";
import { ParticipantStatus } from "../database/enums/participants";
import { Participant } from "../entities/Participant";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import { MessagesService } from "../services/MessagesService";
import { NotificationsService } from "../services/NotificationsService";
import { ParticipantsService } from "../services/ParticipantsService"

io.on("connection", async (socket: ISocketAuthenticated) => {
  const notificationsService = new NotificationsService();
  const participantsService = new ParticipantsService()
  const messagesService = new MessagesService();
  
  const userID = socket.userID;
  let participant: Participant
  let groupID: string;

  socket.on("connect_in_chat", async (id: string) => {
    groupID = id;   
    await socket.join(id);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    participant = await participantsService.index(socket.userID, groupID)
    
    if (participant) {
      await participantsRepository.update(participant.id, {
        status: ParticipantStatus.ONLINE
      })
    }

    socket.in(groupID).emit("new_user_online", userID)

    console.log(`Socket ${socket.id} conectado no grupo ${id}`);
  });

  socket.on("leave_chat", async () => {
    if (participant) {
      const participantsRepository = getCustomRepository(ParticipantsRepository);

      participantsRepository.update(participant.id, {
        status: ParticipantStatus.OFFLINE
      })
    }

    socket.in(groupID).emit("new_user_offline", userID)
  })

  socket.on("new_user_message", async (data: { message: string }) => {
    const createdMessage = await messagesService.create({
      author_id: userID,
      group_id: groupID,
      message: data.message,
    });

    socket.emit("sended_user_message", createdMessage);
    socket.in(groupID).emit("new_user_message", createdMessage);

    await notificationsService.send({
      tokens: await messagesService.getNotificationsTokens(groupID, userID),
      data: createdMessage,
      channelId: "messages",
      categoryId: "message",
      message: {
        content: {
          title: `${createdMessage.group.name}`,
          body: `💬 ${createdMessage.author.name}: ${createdMessage.message}`
        },
      },
    })

  });

  socket.on("new_voice_message", async (data) => {
    const newVoiceMessage = await messagesService.createAudio({
      audio: data.audio,
      author_id: userID,
      group_id: groupID,
      message: data.message,
    });

    socket.emit("sended_user_message", newVoiceMessage);
    socket.in(groupID).emit("new_user_message", newVoiceMessage);

    await notificationsService.send({
      tokens: await messagesService.getNotificationsTokens(groupID, userID),
      data: newVoiceMessage,
      channelId: "messages",
      message: {
        content: {
          title: `${newVoiceMessage.group.name}`,
          body: `🗣 ${newVoiceMessage.author.name}: 🎤`
        },
      },
    })
  });

  socket.on("new_message_with_files", async (data) => {
    const newMessageWithFiles = await messagesService.getMessageWithFiles({
      author_id: userID,
      group_id: groupID,
      message_id: data.message_id,
      message: data.message,
    });

    socket.emit("sended_user_message", newMessageWithFiles);
    socket.in(groupID).emit("new_user_message", newMessageWithFiles);

    await notificationsService.send({
      tokens: await messagesService.getNotificationsTokens(groupID, userID),
      data: newMessageWithFiles,
      channelId: "messages",
      message: {
        content: {
          title: `${newMessageWithFiles.group.name}`,
          body: `📂 ${newMessageWithFiles.author.name}: ${newMessageWithFiles.message}`
        },
      },
    })
  });

  socket.on("add_user_typing", async ({ typing }) => {
    const usersRepository = getCustomRepository(UsersRepository)
    const user = await usersRepository.findOne(userID)

    socket.emit("new_user_typing", user)
  })

  socket.on("remove_user_typing", async ({ typing, user_id }) => {
    socket.emit("deleted_user_typing", userID)
  })

  socket.on("set_read_message", async (messageID: string) => {
    await messagesService.readMessage(userID, messageID, groupID)
  })

  socket.on("delete_user_message", async (messageID: string) => {
    await messagesService.delete(messageID, userID, groupID);
    socket.in(groupID).emit("delete_user_message", messageID);
    socket.emit("delete_user_message", messageID);
  });
});
