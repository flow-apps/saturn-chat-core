import * as Yup from "yup";
import { Time } from "../utils/time";
import { Audio } from "../entities/Audio";
import { StorageManager } from "./StorageManager";
import { getCustomRepository, In, Not } from "typeorm";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { ParticipantsService } from "./ParticipantsService";
import { ReadMessagesRepository } from "../repositories/ReadMessagesRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { NotificationsService } from "./NotificationsService";
import {
  ParticipantRole,
  ParticipantState,
  ParticipantStatus,
} from "../database/enums/participants";
import { GroupType } from "../database/enums/groups";
import { FriendsRepository } from "../repositories/FriendsRepository";
import { FriendsState } from "../database/enums/friends";

interface ICreateMessageProps {
  message: string;
  group_id: string;
  author_id: string;
  reply_to_id?: string;
}

interface ICreateAudioProps {
  audio: Audio;
  message?: string;
  group_id: string;
  author_id: string;
  reply_to_id?: string;
}

interface IGetMessageWithFilesProps {
  message: string;
  message_id: string;
  author_id: string;
  group_id: string;
}

interface IGetNotificationsTokensOptions {
  getOnlines?: boolean;
}

class MessagesService {
  async getNotificationsTokens(
    groupID: string,
    userID: string,
    options: IGetNotificationsTokensOptions = {}
  ) {
    const notificationsService = new NotificationsService();
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    const participantsID = await participantsRepository
      .find({
        where: {
          group_id: groupID,
          status: options.getOnlines
            ? In([ParticipantStatus.ONLINE, ParticipantStatus.OFFLINE])
            : Not(ParticipantStatus.ONLINE),
          user_id: Not(
            process.env.NODE_ENV === "development" ? userID : undefined
          ),
        },
        select: ["user_id"],
      })
      .then((part) => part.map((p) => p.user_id));

    const tokens = await notificationsService.getNotificationsTokens({
      usersID: participantsID,
    });

    return tokens;
  }

  async create(msgData: ICreateMessageProps) {
    const messageRepository = getCustomRepository(MessagesRepository);
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository);
    const participantsService = new ParticipantsService();

    const participant = await participantsService.index(
      msgData.author_id,
      msgData.group_id
    );

    if (!participant || participant.state !== ParticipantState.JOINED) {
      throw new Error("Error on create a message for this group!");
    }

    if (participant.group.type === GroupType.DIRECT) {
      const friendsRepository = getCustomRepository(FriendsRepository);
      const friend = await friendsRepository.findOne({
        where: [
          { received_by_id: msgData.author_id, chat_id: msgData.group_id },
          { requested_by_id: msgData.author_id, chat_id: msgData.group_id },
        ],
        cache: true
      });

      if (!friend || friend.state !== FriendsState.FRIENDS) {
        throw new Error("You are not friends with this user!");
      }
    }

    const schema = Yup.object().shape({
      message: Yup.string().max(500),
      group_id: Yup.string().required(),
      author_id: Yup.string().required(),
      reply_to_id: Yup.string(),
    });

    try {
      await schema.validate(msgData, { abortEarly: false });
    } catch (error) {
      throw new Error(error);
    }

    const newMessage = messageRepository.create({
      ...msgData,
      participant_id: participant.id,
    });
    const savedMessage = await messageRepository.save(newMessage);
    const newReadMessage = readMessagesRepository.create({
      message_id: savedMessage.id,
      user_id: savedMessage.author_id,
      group_id: msgData.group_id,
    });

    await readMessagesRepository.save(newReadMessage);
    const message = await messageRepository.findOne(savedMessage.id, {
      where: { group_id: savedMessage.group_id },
      relations: [
        "author",
        "author.avatar",
        "group",
        "reply_to",
        "reply_to.author",
        "reply_to.group",
      ],
      cache: new Time().timeToMS(1, "hour"),
    });

    return message;
  }

  async createAudio(audioData: ICreateAudioProps) {
    try {
      const messagesRepository = getCustomRepository(MessagesRepository);
      const participantsService = new ParticipantsService();

      const participant = await participantsService.index(
        audioData.author_id,
        audioData.group_id
      );

      if (!participant || participant.state !== ParticipantState.JOINED) {
        throw new Error("Error on create a message for this group!");
      }

      if (participant.group.type === GroupType.DIRECT) {
        const friendsRepository = getCustomRepository(FriendsRepository);
        const friend = await friendsRepository.findOne({
          where: [
            { received_by_id: audioData.author_id, chat_id: audioData.group_id },
            { requested_by_id: audioData.author_id, chat_id: audioData.group_id },
          ],
          cache: true
        });
  
        if (!friend || friend.state !== FriendsState.FRIENDS) {
          throw new Error("You are not friends with this user!");
        }
      }

      const data = {
        message: audioData.message,
        author_id: audioData.author_id,
        group_id: audioData.group_id,
        voice_message_id: audioData.audio.id,
        participant_id: participant.id,
        reply_to_id: audioData.reply_to_id,
      };

      const newMessage = messagesRepository.create(data);
      await messagesRepository.save(newMessage);
      const completedMessage = await messagesRepository.findOne(newMessage.id, {
        loadEagerRelations: true,
        relations: [
          "author",
          "author.avatar",
          "group",
          "reply_to",
          "reply_to.author",
          "reply_to.group",
        ],
      });

      return completedMessage;
    } catch (error) {
      new Error(error);
    }
  }

  async getMessageWithFiles(msgData: IGetMessageWithFilesProps) {
    const messagesRepository = getCustomRepository(MessagesRepository);
    const participantsService = new ParticipantsService();

    const participant = await participantsService.index(
      msgData.author_id,
      msgData.group_id
    );

    if (!participant || participant.state !== ParticipantState.JOINED) {
      throw new Error("Error on create a message for this group!");
    }

    if (participant.group.type === GroupType.DIRECT) {
      const friendsRepository = getCustomRepository(FriendsRepository);
      const friend = await friendsRepository.findOne({
        where: [
          { received_by_id: msgData.author_id, chat_id: msgData.group_id },
          { requested_by_id: msgData.author_id, chat_id: msgData.group_id },
        ],
        cache: true
      });

      if (!friend || friend.state !== FriendsState.FRIENDS) {
        throw new Error("You are not friends with this user!");
      }
    }

    const completedMessage = await messagesRepository.findOne(
      msgData.message_id,
      {
        loadEagerRelations: true,
        relations: [
          "author",
          "author.avatar",
          "group",
          "reply_to",
          "reply_to.author",
          "reply_to.group",
        ],
      }
    );

    return completedMessage;
  }

  async readMessage(messageID: string, userID: string, groupID: string) {
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository);
    const isRead = await readMessagesRepository.findOne({
      where: { user_id: userID, message_id: messageID },
    });

    if (!isRead) {
      const newReadMessage = readMessagesRepository.create({
        message_id: messageID,
        user_id: userID,
        group_id: groupID,
      });

      await readMessagesRepository.save(newReadMessage);
    }
  }

  async delete(messageID: string, userID: string, groupID: string) {
    const storage = new StorageManager();
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const messageRepository = getCustomRepository(MessagesRepository);
    const message = await messageRepository.findOne(messageID, {
      relations: ["files", "voice_message"],
    });
    const participant = await participantsRepository.findOne({
      where: { group_id: groupID, user_id: userID },
    });

    const authorizedRoles = [
      ParticipantRole.OWNER,
      ParticipantRole.ADMIN,
      ParticipantRole.MODERATOR,
    ];

    if (
      userID !== message.author_id &&
      !authorizedRoles.includes(participant.role)
    ) {
      throw new Error("Unauthorized user/role for delete message");
    }

    try {
      await messageRepository.delete(message.id).then(async () => {
        if (message.voice_message)
          await storage.deleteFile(message.voice_message.path);

        if (message.files.length > 0) {
          await Promise.all(
            message.files.map(async (file) => {
              await storage.deleteFile(file.path);
            })
          );
        }
      });

      const deletedMessageData = {
        id: message.id,
        type: message.voice_message ? "audio" : "message",
        files: !message.files.length
          ? null
          : message.files.map((f) => ({
              id: f.id,
              name: f.name,
              type: f.type,
            })),
        voice_message: !message.voice_message
          ? null
          : {
              id: message.voice_message.id,
              name: message.voice_message.name,
            },
      };

      return deletedMessageData;
    } catch (error) {
      throw new Error(error);
    }
  }
}

export { MessagesService };
