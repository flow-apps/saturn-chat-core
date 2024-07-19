import * as Yup from "yup";
import { Time } from "../utils/time";
import { Audio } from "../entities/Audio";
import { StorageManager } from "./StorageManager";
import { getCustomRepository, In, Not } from "typeorm";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { ParticipantsService } from "./ParticipantsService";
import { ReadMessagesRepository } from "../repositories/ReadMessagesRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import {
  ParticipantRole,
  ParticipantState,
  ParticipantStatus,
} from "../database/enums/participants";
import { GroupType } from "../database/enums/groups";
import { FriendsRepository } from "../repositories/FriendsRepository";
import { FriendsState } from "../database/enums/friends";
import { LinkUtils } from "../utils/link";
import { LinkData } from "../types/interfaces";
import { SaturnChatDomains } from "../configs.json";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";
import { AudiosRepository } from "../repositories/AudiosRepository";
import { remoteConfigs } from "../configs/remoteConfigs";
import Cryptr from "cryptr";

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

interface IGetUserIDsOptions {
  getOnlines?: boolean;
  excludedIds?: string[];
}

class MessagesService {
  private MAX_MESSAGE_LENGTH_PREMIUM: number;
  private MAX_MESSAGE_LENGTH_DEFAULT: number;
  private cryptr = new Cryptr(process.env.ENCRYPT_MESSAGE_KEY);

  constructor() {
    this.MAX_MESSAGE_LENGTH_PREMIUM = Number(
      remoteConfigs.premium_max_message_length
    );
    this.MAX_MESSAGE_LENGTH_DEFAULT = Number(
      remoteConfigs.default_max_message_length
    );
  }

  encryptMessage(message: string) {
    return this.cryptr.encrypt(message);
  }

  decryptMessage(hash: string) {
    return this.cryptr.decrypt(hash);
  }

  async getParticipantsUserIds(
    groupID: string,
    options: IGetUserIDsOptions = {}
  ) {
    const userNotifications = getCustomRepository(UserNotificationsRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const participantsUserIds = await participantsRepository
      .find({
        where: {
          group_id: groupID,
          user_id: options.excludedIds ? Not(options.excludedIds) : undefined,
          state: ParticipantState.JOINED,
          status: options.getOnlines
            ? In([ParticipantStatus.ONLINE, ParticipantStatus.OFFLINE])
            : ParticipantStatus.OFFLINE,
        },
        select: ["user_id"],
      })
      .then((parts) => parts.map((p) => p.user_id));

    const userIds = await userNotifications
      .find({
        where: {
          user_id: In(participantsUserIds),
          send_notification: true,
          is_revoked: false,
        },
        select: ["user_id"],
      })
      .then((users) => users.map((u) => u.user_id));

    return userIds;
  }

  async create(msgData: ICreateMessageProps, isPremium = false) {
    const messageRepository = getCustomRepository(MessagesRepository);
    const participantsService = new ParticipantsService();

    const linkUtils = new LinkUtils();
    const links = linkUtils.getAllLinksFromText(msgData.message);

    const participant = await participantsService.index(
      msgData.author_id,
      msgData.group_id
    );

    if (!participant || participant.state !== ParticipantState.JOINED) {
      throw new Error("Participant not joined");
    }

    if (isPremium) {
      if (msgData.message.length > this.MAX_MESSAGE_LENGTH_PREMIUM) {
        throw new Error("Message length error for premium users");
      }
    } else {
      if (msgData.message.length > this.MAX_MESSAGE_LENGTH_DEFAULT) {
        throw new Error("Message length error for default users");
      }
    }

    if (participant.group.type === GroupType.DIRECT) {
      const friendsRepository = getCustomRepository(FriendsRepository);
      const friend = await friendsRepository.findOne({
        where: [
          { received_by_id: msgData.author_id, chat_id: msgData.group_id },
          { requested_by_id: msgData.author_id, chat_id: msgData.group_id },
        ],
        cache: true,
      });

      if (!friend || friend.state !== FriendsState.FRIENDS) {
        throw new Error("You are not friends with this user!");
      }
    }

    const schema = Yup.object().shape({
      message: Yup.string().max(
        isPremium
          ? this.MAX_MESSAGE_LENGTH_PREMIUM
          : this.MAX_MESSAGE_LENGTH_DEFAULT
      ),
      group_id: Yup.string().required(),
      author_id: Yup.string().required(),
      reply_to_id: Yup.string(),
    });

    try {
      await schema.validate(msgData, { abortEarly: false });
    } catch (error) {
      throw new Error(error);
    }

    let linksData: LinkData[] = [];

    if (links) {
      await Promise.all(
        links.map(async (link) => {
          if (SaturnChatDomains.includes(link)) return;

          const data = await linkUtils.getDataFromLink(link);

          if (data) linksData.push(data);
        })
      );
    }

    const newMessage = messageRepository.create({
      ...msgData,
      message: this.encryptMessage(msgData.message),
      encrypted: true,
      participant_id: participant.id,
      links: linksData,
    });
    const savedMessage = await messageRepository.save(newMessage);
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

    await this.readMessage(
      newMessage.id,
      newMessage.author_id,
      newMessage.group_id
    );

    message.message = this.decryptMessage(message.message)

    return message;
  }

  async createAudio(audioData: ICreateAudioProps, isPremium = false) {
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
            {
              received_by_id: audioData.author_id,
              chat_id: audioData.group_id,
            },
            {
              requested_by_id: audioData.author_id,
              chat_id: audioData.group_id,
            },
          ],
          cache: true,
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
        encrypted: true
      };

      const newMessage = messagesRepository.create(data);
      await messagesRepository.save(newMessage);
      await this.readMessage(
        newMessage.id,
        newMessage.author_id,
        newMessage.group_id
      );
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
        cache: true,
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

    completedMessage.message = completedMessage.encrypted
      ? this.decryptMessage(completedMessage.message)
      : completedMessage.message;

    return completedMessage;
  }

  async readMessage(messageID: string, userID: string, groupID: string) {
    if (!groupID || !messageID || !userID) return;

    const readMessagesRepository = getCustomRepository(ReadMessagesRepository);
    const isRead = await readMessagesRepository.findOne({
      where: { user_id: userID, group_id: groupID, message_id: messageID },
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
    const audiosRepository = getCustomRepository(AudiosRepository);
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
        await audiosRepository.delete({ id: message.voice_message_id });

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
