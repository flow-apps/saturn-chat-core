import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { StorageManager } from "../services/StorageManager";
import { AudiosRepository } from "../repositories/AudiosRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { FilesRepository } from "../repositories/FilesRepository";
import { GroupType } from "../database/enums/groups";
import { FriendsRepository } from "../repositories/FriendsRepository";
import { FriendsState } from "../database/enums/friends";
import { ParticipantState } from "../database/enums/participants";
import { MessagesService } from "../services/MessagesService";
import { RequestPremium } from "../middlewares/validatePremium";
import { remoteConfigs } from "../configs/remoteConfigs";

class MessagesController {
  private MAX_FILE_SIZE_PREMIUM: number;
  private MAX_FILE_SIZE_DEFAULT: number;
  private MAX_MESSAGE_LENGTH_PREMIUM: number;
  private MAX_MESSAGE_LENGTH_DEFAULT: number;

  constructor() {
    this.MAX_MESSAGE_LENGTH_PREMIUM = Number(
      remoteConfigs.premium_max_message_length
    );

    this.MAX_MESSAGE_LENGTH_DEFAULT = Number(
      remoteConfigs.default_max_message_length
    );

    this.MAX_FILE_SIZE_PREMIUM = Number(remoteConfigs.premium_file_upload);

    this.MAX_FILE_SIZE_DEFAULT = Number(remoteConfigs.default_file_upload);
  }

  async list(req: RequestAuthenticated, res: Response) {
    const { groupID } = req.params;
    const { _limit, _page } = req.query;

    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const messageRepository = getCustomRepository(MessagesRepository);

    const messagesService = new MessagesService();

    const participant = await participantsRepository.findOne({
      where: {
        group_id: groupID,
        user_id: req.userId,
        state: ParticipantState.JOINED,
      },
      cache: 50000,
    });

    if (!participant) {
      throw new AppError("Participant not found", 404);
    }

    if (!groupID) {
      throw new AppError("Group ID not provided");
    }

    const messages = await messageRepository.find({
      where: { group_id: groupID },
      relations: [
        "author",
        "author.avatar",
        "group",
        "reply_to",
        "reply_to.author",
        "reply_to.group",
      ],
      take: Number(_limit),
      skip: Number(_page) * Number(_limit),
      order: { created_at: "DESC" },
    });

    await Promise.all(
      messages.map(async (message) => {
        await messagesService.readMessage(message.id, req.userId, groupID);
      })
    );

    const decryptedMessages = messages.map((message) => {
      if (message.encrypted) {
        message.message = messagesService.decryptMessage(message.message);

        if (message.reply_to && message.reply_to.encrypted) {
          message.reply_to.message = messagesService.decryptMessage(
            message.reply_to.message
          );
        }
      }

      return message;
    });

    return res.status(200).json({ messages: decryptedMessages });
  }

  async createAttachment(req: RequestPremium, res: Response) {
    const body = req.body;
    const storage = new StorageManager();

    const messageRepository = getCustomRepository(MessagesRepository);
    const audiosRepository = getCustomRepository(AudiosRepository);
    const filesRepository = getCustomRepository(FilesRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const messagesService = new MessagesService();

    const attachType = String(req.query.type);
    const groupID = req.params.groupID;

    const participant =
      await participantsRepository.findParticipantWithPremiumField({
        where: {
          group_id: groupID,
          user_id: req.userId,
          state: ParticipantState.JOINED,
        },
        cache: 50000,
      });

    if (!participant) {
      throw new AppError("Participant not found", 404);
    }

    if (participant.group.type === GroupType.DIRECT) {
      const friendsRepository = getCustomRepository(FriendsRepository);
      const friend = await friendsRepository.findOne({
        where: [
          { received_by_id: req.userId, chat_id: groupID },
          { requested_by_id: req.userId, chat_id: groupID },
        ],
        cache: true,
      });

      if (!friend || friend.state !== FriendsState.FRIENDS) {
        throw new AppError("You are not friends with this user!", 403);
      }
    }

    if (attachType === "voice_message") {
      const file = req.files[0] as Express.Multer.File;
      const uploadedFile = await storage.uploadFile({
        file,
        path: `groups/${groupID}/attachments/audios`,
      });

      const audio = audiosRepository.create({
        name: uploadedFile.name,
        group_id: groupID,
        participant_id: participant.id,
        url: uploadedFile.url,
        path: uploadedFile.path,
        duration: body.duration,
        size: uploadedFile.size,
      });

      await audiosRepository.save(audio);
      return res.json(audio);
    } else if (attachType === "files") {
      const files = req.files as Express.Multer.File[];

      if (req.isPremium) {
        const hasOversizedFile = files.some((file) => {
          file.size > this.MAX_FILE_SIZE_PREMIUM;
        });

        if (
          hasOversizedFile ||
          body.message.length > this.MAX_MESSAGE_LENGTH_PREMIUM
        ) {
          throw new AppError("File or message size not permitted");
        }
      } else {
        const hasOversizedFile = files.some((file) => {
          file.size > this.MAX_FILE_SIZE_DEFAULT;
        });

        if (
          hasOversizedFile ||
          body.message.length > this.MAX_MESSAGE_LENGTH_DEFAULT
        ) {
          throw new AppError("File or message size not permitted");
        }
      }

      const createdMessage = messageRepository.create({
        author_id: req.userId,
        group_id: groupID,
        message: messagesService.encryptMessage(body.message),
        participant_id: participant.id,
        reply_to_id: body.reply_to_id,
        encrypted: true,
      });

      await messageRepository.save(createdMessage);
      await messagesService.readMessage(
        createdMessage.id,
        createdMessage.author_id,
        groupID
      );

      const uploadedFiles = await storage.uploadMultipleFiles({
        files,
        path: `groups/${groupID}/attachments/files`,
      });

      const savedFiles = await Promise.all(
        uploadedFiles.map(async (uFile) => {
          if (uFile) {
            const createdFile = filesRepository.create({
              ...uFile,
              user_id: req.userId,
              group_id: groupID,
              message_id: createdMessage.id,
            });

            await filesRepository.save(createdFile);
            return createdFile;
          }
        })
      );

      createdMessage.message = messagesService.decryptMessage(
        createdMessage.message
      );

      if (createdMessage.reply_to) {
        createdMessage.reply_to.message = messagesService.decryptMessage(
          createdMessage.reply_to.message
        );
      }

      return res.json({ files: savedFiles, message_id: createdMessage.id });
    }
  }
}

export { MessagesController };
