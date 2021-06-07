import { Request, Response } from "express";
import { getCustomRepository, ILike, Not } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { ParticipantsService } from "../services/ParticipantsService";
import { StorageManager, UploadedFile } from "../services/StorageManager";
import { avatarProcessor } from "../utils/avatarProcessor";

interface Data {
  name: string;
  owner_id: string;
  description: string;
  privacy: string;
  group_avatar?: {
    url: string;
    name: string;
    path: string;
  };
}
class GroupsController {
  async create(req: RequestAuthenticated, res: Response) {
    const body = req.body;
    const groupAvatar = req.file;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participants = new ParticipantsService();
    const schema = Yup.object().shape({
      name: Yup.string().max(100).required(),
      description: Yup.string().max(500).required(),
      privacy: Yup.string().uppercase().required(),
    });

    try {
      await schema.validate(body, { abortEarly: false });
    } catch (error) {
      throw new AppError(error);
    }

    const data: Data = {
      name: body.name,
      description: body.description,
      privacy: String(body.privacy).toUpperCase(),
      owner_id: req.userId,
    };

    let processedImage: Buffer;

    if (groupAvatar) {
      processedImage = await avatarProcessor({
        avatar: groupAvatar.buffer,
        quality: 60,
      });
      groupAvatar.buffer = processedImage;
      const storage = new StorageManager();
      const uploadedAvatar = (await storage.uploadFile({
        file: groupAvatar,
        path: "groups/avatars",
      })) as UploadedFile;

      data.group_avatar = {
        url: uploadedAvatar.url,
        name: uploadedAvatar.name,
        path: uploadedAvatar.path,
      };
    }

    const group = groupsRepository.create(data);
    await groupsRepository.save(group);

    await participants.new({ group_id: group.id, user_id: req.userId });
    return res.status(200).json(group);
  }
  async index(req: Request, res: Response) {
    const { id } = req.params;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    if (!id) {
      throw new AppError("Group ID not provided!");
    }

    const group = await groupsRepository.findOne(id, {
      relations: ["owner", "group_avatar", "participants"],
      loadEagerRelations: true,
    });

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    const count = await participantsRepository.count({
      where: { group_id: id },
    });

    return res.status(200).json(group);
  }
  async delete(req: RequestAuthenticated, res: Response) {
    const { id } = req.params;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const storage = new StorageManager();

    if (!id) {
      throw new AppError("Group ID not provided!");
    }

    const group = await groupsRepository.findOne(id, {
      relations: ["group_avatar"],
    });

    if (!group) {
      throw new AppError("Group not found!", 404);
    }

    if (group.owner_id !== req.userId) {
      throw new AppError("User not authorized for this action!", 403);
    }

    await storage.deleteFile(group.group_avatar.path);
    await groupsRepository.delete(group.id);

    return res.sendStatus(204);
  }

  async list(req: RequestAuthenticated, res: Response) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    const groups = await participantsRepository.find({
      where: { user_id: req.userId },
      loadEagerRelations: true,
    });

    return res.status(200).json(groups);
  }

  async search(req: RequestAuthenticated, res: Response) {
    const { q, _limit, _page } = req.query;
    const groupsRepository = getCustomRepository(GroupsRepository);

    if (!q) {
      throw new AppError("Query not provided");
    }

    const query = String(q).toLowerCase().trim();

    const groups = await groupsRepository.find({
      where: {
        name: ILike(`%${query}%`),
        privacy: Not("PRIVATE"),
      },
      skip: Number(_page) * Number(_limit),
      take: Number(_limit),
      cache: 10000,
    });

    return res.status(200).json(groups);
  }
}

export { GroupsController };
