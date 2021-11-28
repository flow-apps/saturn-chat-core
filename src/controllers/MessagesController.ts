import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { StorageManager } from "../services/StorageManager";
import { AudiosRepository } from "../repositories/AudiosRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { FilesRepository } from "../repositories/FilesRepository";
import { ReadMessagesRepository } from "../repositories/ReadMessagesRepository";

class MessagesController {
  async list(req: RequestAuthenticated, res: Response) {
    const { groupID } = req.params;
    const { _limit, _page } = req.query;

    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const messageRepository = getCustomRepository(MessagesRepository);
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository);

    const participant = await participantsRepository.findOne({
      where: { group_id: groupID, user_id: req.userId },
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
      relations: ["author", "author.avatar", "group"],
      take: Number(_limit),
      skip: Number(_page) * Number(_limit),
      order: { created_at: "DESC" },
    });

    Promise.all(messages.map(async (message) => {
        const isRead = await readMessagesRepository.findOne({
          where: { message_id: message.id, user_id: req.userId },
        });

        if (!isRead) {
          const newMessageRead = readMessagesRepository.create({
            message_id: message.id,
            user_id: req.userId,
            group_id: groupID
          })
          await readMessagesRepository.save(newMessageRead)
        }
    }));    

    return res.status(200).json({ messages });
  }

  async createAttachment(req: RequestAuthenticated, res: Response) {
    const body = req.body;
    const storage = new StorageManager();

    const messageRepository = getCustomRepository(MessagesRepository);
    const audiosRepository = getCustomRepository(AudiosRepository);
    const filesRepository = getCustomRepository(FilesRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    const attachType = String(req.query.type);
    const groupID = req.params.groupID;

    const participant = await participantsRepository.findOne({
      where: { group_id: groupID, user_id: req.userId },
      cache: 50000,
    });

    if (!participant) {
      throw new AppError("Participant not found", 404);
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
        size: body.size,
      });

      await audiosRepository.save(audio);
      return res.json(audio);

    } else if (attachType === "files") {
      const createdMessage = messageRepository.create({
        author_id: req.userId,
        group_id: groupID,
        message: req.body.message,
        participant_id: participant.id
      });

      await messageRepository.save(createdMessage);

      const files = req.files as Express.Multer.File[];
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

      return res.json({ files: savedFiles, message_id: createdMessage.id });
    }
  }
}

export { MessagesController };
