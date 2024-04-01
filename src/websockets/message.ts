import { getCustomRepository } from "typeorm";
import { io, ISocketAuthenticated, ISocketPremium } from ".";
import { GroupType } from "../database/enums/groups";
import { UsersRepository } from "../repositories/UsersRepository";
import { MessagesService } from "../services/MessagesService";
import { NotificationsService } from "../services/NotificationsService";

import { ONESIGNAL } from "../configs.json";
import { Time } from "../utils/time";
import { NotificationsType } from "../types/enums";
import { CacheService } from "../services/CacheService";

io.on("connection", async (socket: ISocketPremium) => {
  const notificationsService = new NotificationsService();
  const messagesService = new MessagesService();
  const cacheService = new CacheService();
  const timeUtils = new Time();

  const userID = socket.userID;

  socket.on("new_user_message", async (data) => {
    const createdMessage = await messagesService.create({
      author_id: socket.userID,
      group_id: data.group_id,
      message: data.message,
      reply_to_id: data.reply_to_id,
    }, socket.isPremium);

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
    socket.in(data.group_id).emit("new_user_message", createdMessage);

    await notificationsService.send({
      name: "Message Notification",
      android_group: data.group_id,
      large_icon: groupAvatar,
      tokens: await messagesService.getParticipantsUserIds(
        createdMessage.group_id,
        {
          getOnlines: false,
          excludedIds: [createdMessage.author_id],
        }
      ),
      data: {
        type: NotificationsType.CHAT_MESSAGE,
        open_in_app: true,
        message_id: createdMessage.id,
        author_id: createdMessage.author.id,
        group_id: createdMessage.group.id,
        group_type: isDM ? GroupType.DIRECT : GroupType.GROUP,
        friend_name: isDM ? groupName : undefined,
        friend_id: isDM ? createdMessage.author_id : undefined,
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
          pt:
            "💬 " +
            (!isDM ? `${createdMessage.author.name}: ` : "") +
            `${createdMessage.message}`,
        },
      },
    });
  });

  socket.on("new_voice_message", async (data) => {
    const newVoiceMessage = await messagesService.createAudio({
      audio: data.audio,
      author_id: userID,
      group_id: data.group_id,
      message: data.message,
      reply_to_id: data.reply_to_id,
    }, socket.isPremium);
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
    socket.in(data.group_id).emit("new_user_message", newVoiceMessage);

    await notificationsService.send({
      name: "Message Notification",
      tokens: await messagesService.getParticipantsUserIds(
        newVoiceMessage.group_id,
        {
          getOnlines: false,
          excludedIds: [newVoiceMessage.author_id],
        }
      ),
      large_icon: groupAvatar,
      android_group: data.group_id,
      data: {
        type: NotificationsType.CHAT_MESSAGE,
        open_in_app: true,
        message_id: newVoiceMessage.id,
        author_id: newVoiceMessage.author.id,
        group_id: newVoiceMessage.group.id,
        group_type: isDM ? GroupType.DIRECT : GroupType.GROUP,
        friend_name: isDM ? groupName : undefined,
        friend_id: isDM ? newVoiceMessage.author_id : undefined,
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
      group_id: data.group_id,
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
    socket.in(data.group_id).emit("new_user_message", newMessageWithFiles);

    await notificationsService.send({
      name: "Message Notification",
      tokens: await messagesService.getParticipantsUserIds(
        newMessageWithFiles.group_id,
        {
          getOnlines: false,
          excludedIds: [newMessageWithFiles.author_id],
        }
      ),
      large_icon: groupAvatar,
      android_group: data.group_id,
      data: {
        type: NotificationsType.CHAT_MESSAGE,
        open_in_app: true,
        message_id: newMessageWithFiles.id,
        author_id: newMessageWithFiles.author.id,
        group_id: newMessageWithFiles.group.id,
        group_type: isDM ? GroupType.DIRECT : GroupType.GROUP,
        friend_name: isDM ? groupName : undefined,
        friend_id: isDM ? newMessageWithFiles.author_id : undefined,
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

  socket.on("add_user_typing", async ({ group_id }) => {
    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findOne(userID);
    const alreadyTyping = await cacheService.verifyExistKey(
      `user_typing_${userID}_${group_id}`
    );

    if (!alreadyTyping) {
      await cacheService.set(`user_typing_${userID}_${group_id}`, "true");
      socket.in(group_id).emit("new_user_typing", user);
    }
  });

  socket.on("remove_user_typing", async ({ group_id }) => {
    const isTyping = await cacheService.verifyExistKey(
      `user_typing_${userID}_${group_id}`
    );

    if (isTyping) {
      await cacheService.delete(`user_typing_${userID}_${group_id}`);
    }

    socket.in(group_id).emit("deleted_user_typing", userID);
  });

  socket.on("set_read_message", async ({ message_id, group_id }) => {
    await messagesService.readMessage(message_id, userID, group_id);
  });

  socket.on("delete_user_message", async ({ message_id, group_id }) => {
    const result = await messagesService.delete(message_id, userID, group_id);
    socket.in(group_id).emit("delete_user_message", result);
    socket.emit("delete_user_message", result);
  });
});
