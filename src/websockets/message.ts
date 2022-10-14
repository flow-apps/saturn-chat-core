import { getCustomRepository } from "typeorm";
import { io, ISocketAuthenticated } from ".";
import { GroupType } from "../database/enums/groups";
import { ParticipantStatus } from "../database/enums/participants";
import { Participant } from "../entities/Participant";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import { MessagesService } from "../services/MessagesService";
import { NotificationsService } from "../services/NotificationsService";
import { ParticipantsService } from "../services/ParticipantsService";

import { ONESIGNAL } from "../configs.json";
import { Time } from "../utils/time";

io.on("connection", async (socket: ISocketAuthenticated) => {
  const notificationsService = new NotificationsService();
  const participantsService = new ParticipantsService();
  const messagesService = new MessagesService();

  const timeUtils = new Time();

  const userID = socket.userID;
  let participant: Participant;
  let groupID: string;

  socket.on("connect_in_chat", async (id: string) => {
    groupID = id;
    await socket.join(id);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    participant = await participantsService.index(socket.userID, groupID);

    if (participant) {
      await participantsRepository.update(participant.id, {
        status: ParticipantStatus.ONLINE,
      });
    }

    socket.in(groupID).emit("new_user_online", userID);
    console.log(`Socket ${socket.id} conectado no grupo ${id}`);
  });

  socket.on("leave_chat", async () => {
    if (participant) {
      const participantsRepository = getCustomRepository(
        ParticipantsRepository
      );

      participantsRepository.update(participant.id, {
        status: ParticipantStatus.OFFLINE,
      });
    }

    socket.in(groupID).emit("new_user_offline", userID);
  });

  socket.on(
    "new_user_message",
    async (data: {
      message: string;
      reply_to_id: string;
      localReference: string;
    }) => {
      const createdMessage = await messagesService.create({
        author_id: socket.userID,
        group_id: groupID,
        message: data.message,
        reply_to_id: data.reply_to_id,
      });

      const isDM = createdMessage.group.type === GroupType.DIRECT;
      const groupName = isDM
        ? createdMessage.author.name
        : createdMessage.group.name;
      const groupAvatar = isDM
        ? createdMessage.author.avatar?.url
        : createdMessage.group.group_avatar?.url;

      socket.emit("sended_user_message", {
        msg: createdMessage,
        localReference: data.localReference,
      });
      socket.in(groupID).emit("new_user_message", createdMessage);

      await notificationsService.send({
        name: "Message Notification",
        android_group: groupID,
        large_icon: groupAvatar,
        tokens: await messagesService.getNotificationsTokens(groupID, userID, {
          getOnlines: true,
        }),
        data: {
          message_id: createdMessage.id,
          author_id: createdMessage.author.id,
          group_id: createdMessage.group.id,
          created_at: createdMessage.created_at,
        },
        android_channel_id: isDM
          ? ONESIGNAL.CHANNELS_IDS.FRIEND_MESSAGES
          : ONESIGNAL.CHANNELS_IDS.GROUP_MESSAGES,
        message: {
          headings: {
            pt: groupName,
            en: groupName,
          },
          contents: {
            en:
              "💬 " +
              (!isDM ? `${createdMessage.author.name}: ` : "") +
              `${createdMessage.message}`,
          },
        },
      });
    }
  );

  socket.on("new_voice_message", async (data) => {
    const newVoiceMessage = await messagesService.createAudio({
      audio: data.audio,
      author_id: userID,
      group_id: groupID,
      message: data.message,
      reply_to_id: data.reply_to_id,
    });
    const isDM = newVoiceMessage.group.type === GroupType.DIRECT;
    const groupName = isDM
      ? newVoiceMessage.author.name
      : newVoiceMessage.group.name;

    const groupAvatar = isDM
      ? newVoiceMessage.author.avatar?.url
      : newVoiceMessage.group.group_avatar?.url;
    const formattedDuration = timeUtils.formatTime(
      newVoiceMessage.voice_message.duration
    );

    socket.emit("sended_user_message", {
      msg: newVoiceMessage,
      localReference: data.localReference,
    });
    socket.in(groupID).emit("new_user_message", newVoiceMessage);

    console.log(groupName);

    await notificationsService.send({
      name: "Message Notification",
      tokens: await messagesService.getNotificationsTokens(groupID, userID, {
        getOnlines: true,
      }),
      large_icon: groupAvatar,
      android_group: groupID,
      data: {
        message_id: newVoiceMessage.id,
        author_id: newVoiceMessage.author.id,
        group_id: newVoiceMessage.group.id,
        created_at: newVoiceMessage.created_at,
      },
      android_channel_id: isDM
        ? ONESIGNAL.CHANNELS_IDS.FRIEND_MESSAGES
        : ONESIGNAL.CHANNELS_IDS.GROUP_MESSAGES,
      message: {
        headings: {
          pt: groupName,
          en: groupName,
        },
        contents: {
          pt:
            "🎤 " +
            (!isDM ? `${newVoiceMessage.author.name}: ` : "") +
            `Mensagem de voz (${formattedDuration})`,
          en:
            "🎤 " +
            (!isDM ? `${newVoiceMessage.author.name}: ` : "") +
            `Voice message (${formattedDuration})`,
        },
      },
    });
  });

  socket.on("new_message_with_files", async (data) => {
    const newMessageWithFiles = await messagesService.getMessageWithFiles({
      author_id: userID,
      group_id: groupID,
      message_id: data.message_id,
      message: data.message,
    });
    const isDM = newMessageWithFiles.group.type === GroupType.DIRECT;
    const groupName = isDM
      ? newMessageWithFiles.author.name
      : newMessageWithFiles.group.name;
    const groupAvatar = isDM
      ? newMessageWithFiles.author.avatar?.url
      : newMessageWithFiles.group.group_avatar?.url;

    socket.emit("sended_user_message", {
      msg: newMessageWithFiles,
      localReference: data.localReference,
    });
    socket.in(groupID).emit("new_user_message", newMessageWithFiles);

    await notificationsService.send({
      name: "Message Notification",
      tokens: await messagesService.getNotificationsTokens(groupID, userID, {
        getOnlines: true,
      }),
      large_icon: groupAvatar,
      android_group: groupID,
      data: {
        message_id: newMessageWithFiles.id,
        author_id: newMessageWithFiles.author.id,
        group_id: newMessageWithFiles.group.id,
        created_at: newMessageWithFiles.created_at,
      },
      android_channel_id: isDM
        ? ONESIGNAL.CHANNELS_IDS.FRIEND_MESSAGES
        : ONESIGNAL.CHANNELS_IDS.GROUP_MESSAGES,
      message: {
        headings: {
          pt: groupName,
          en: groupName,
        },
        contents: {
          en:
            `📂 ` +
            (!isDM ? `${newMessageWithFiles.author.name}: ` : "") +
            `(${newMessageWithFiles.files.length} files) ` +
            `${newMessageWithFiles.message}`,
          pt:
            `📂 ` +
            (!isDM ? `${newMessageWithFiles.author.name}: ` : "") +
            `(${newMessageWithFiles.files.length} arquivos) ` +
            `${newMessageWithFiles.message}`,
        },
      },
    });
  });

  socket.on("add_user_typing", async ({ typing }) => {
    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findOne(userID);

    socket.in(groupID).emit("new_user_typing", user);
  });

  socket.on("remove_user_typing", async ({ typing, user_id }) => {
    socket.in(groupID).emit("deleted_user_typing", userID);
  });

  socket.on("set_read_message", async (messageID: string) => {
    await messagesService.readMessage(messageID, userID, groupID);
  });

  socket.on("delete_user_message", async (messageID: string) => {
    const result = await messagesService.delete(messageID, userID, groupID);
    socket.in(groupID).emit("delete_user_message", result);
    socket.emit("delete_user_message", result);
  });
});
