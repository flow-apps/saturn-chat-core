import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { MessagesRepository } from "../repositories/MessagesRepository";
import fs from "fs";
import path from "path";
import { StorageManager } from "../services/StorageManager";
import { AudiosRepository } from "../repositories/AudiosRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";

class MessagesController {
  async list(req: RequestAuthenticated, res: Response) {
    const { groupID } = req.params;
    const { _limit, _page } = req.query;
    const messageRepository = getCustomRepository(MessagesRepository);
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

    return res.status(200).json({ messages });
  }

  async createAttachment(req: RequestAuthenticated, res: Response) {
    const storage = new StorageManager();
    const audiosRepository = getCustomRepository(AudiosRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    const attachType = String(req.query.type);
    const groupID = req.params.groupID;

    if (attachType === "voice_message") {
      const participant = await participantsRepository.findOne({
        where: { group_id: groupID, user_id: req.userId },
      });
      const file = req.file;

      const uploadedFile = await storage.uploadFile({
        file,
        path: `groups/${groupID}/audios`,
      });

      const audio = audiosRepository.create({
        name: uploadedFile.name,
        group_id: groupID,
        participant_id: participant.id,
        url: uploadedFile.url,
        path: uploadedFile.path,
      });

      await audiosRepository.save(audio);

      return res.json(audio);
    }
  }
}

export { MessagesController };
