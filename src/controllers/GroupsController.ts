import { Request, Response } from "express";
import { getCustomRepository, ILike, Not, Raw } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsAvatarsRepository } from "../repositories/GroupsAvatarsRepository";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { ParticipantsService } from "../services/ParticipantsService";
import { StorageManager, UploadedFile } from "../services/StorageManager";
import { ImageProcessor } from "../utils/imageProcessor";

interface Body {
  name: string;
  description: string;
  privacy: string;
  tags?: string;
}

interface Data {
  name: string;
  owner_id: string;
  description: string;
  privacy: string;
  tags?: string[];
  group_avatar?: {
    url: string;
    name: string;
    path: string;
  };
}
class GroupsController {
  async create(req: RequestAuthenticated, res: Response) {
    const body = req.body as Body;
    const imageProcessor = new ImageProcessor();

    const groupAvatar = req.file;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const groupsAvatarsRepository = getCustomRepository(
      GroupsAvatarsRepository
    );
    const participants = new ParticipantsService();
    const schema = Yup.object().shape({
      name: Yup.string().max(100).required(),
      description: Yup.string().max(500).required(),
      privacy: Yup.string().uppercase().required(),
      tags: Yup.string(),
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
      tags: body.tags
        ? body.tags
            .trim()
            .toLowerCase()
            .split(",")
            .map((tag) => tag.trim())
        : [],
    };

    let processedImage: Buffer;

    if (groupAvatar) {
      processedImage = await imageProcessor.avatar({
        avatar: groupAvatar.buffer,
        quality: 60,
      });
      groupAvatar.buffer = processedImage;
      const storage = new StorageManager();
      const uploadedAvatar = await storage.uploadFile({
        file: groupAvatar,
        path: "files/groups/avatars",
      });

      const newGroupAvatar = groupsAvatarsRepository.create({
        name: uploadedAvatar.name,
        path: uploadedAvatar.path,
        url: uploadedAvatar.url,
      });

      await groupsAvatarsRepository.save(newGroupAvatar);
      data.group_avatar = newGroupAvatar;
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
      cache: 5000,
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

    const query = String(q).trim();

    const groups = await groupsRepository.find({
      where: [
        {
          name: ILike(`%${query}%`),
          privacy: Not("PRIVATE"),
        },
        {
          tags: Raw((alias) => `${alias} @> :tags`, { tags: [query] }),
          privacy: Not("PRIVATE"),
        },
      ],
      skip: Number(_page) * Number(_limit),
      take: Number(_limit),

      cache: 10000,
    });
    return res.status(200).json(groups);
  }

  async update(req: RequestAuthenticated, res: Response) {
    const body = req.body as Body;
    const userID = req.userId;
    const groupID = req.params.groupID;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const schema = Yup.object().shape({
      name: Yup.string().max(100).required(),
      description: Yup.string().max(500).required(),
      privacy: Yup.string().uppercase().required(),
      tags: Yup.string(),
    });

    let dataValidated;

    try {
      dataValidated = await schema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      throw new AppError(error.errors);
    }

    const group = await groupsRepository.findOne({
      where: [{ id: groupID, owner_id: userID }],
    });

    if (!group) {
      throw new AppError("Invalid group");
    }

    dataValidated.tags = dataValidated.tags
      .trim()
      .toLowerCase()
      .split(",")
      .map((tag: string) => tag.trim());

    const updatedGroupData = Object.assign(group, dataValidated);
    const mergedGroup = groupsRepository.merge(group, updatedGroupData);
    await groupsRepository.save(mergedGroup);

    return res.sendStatus(200);
  }

  async updateAvatar(req: RequestAuthenticated, res: Response) {
    const { groupID } = req.params;
    const avatar = req.file;
    const storage = new StorageManager();
    const imageProcessor = new ImageProcessor();

    const groupsAvatarsRepository = getCustomRepository(
      GroupsAvatarsRepository
    );
    const groupsRepository = getCustomRepository(GroupsRepository);
    let processedImage: Buffer;

    const group = await groupsRepository.findOne({
      where: { id: groupID, owner_id: req.userId },
      relations: ["group_avatar"],
    });

    if (!group || !avatar) {
      throw new AppError("Invalid Group or Avatar not provided");
    }

    const groupAvatar = await groupsAvatarsRepository.findOne(
      group.group_avatar.id
    );
    await storage.deleteFile(groupAvatar.path);

    processedImage = await imageProcessor.avatar({
      avatar: req.file.buffer,
      quality: 60,
    });

    req.file.buffer = processedImage;

    const uploadedAvatar = await storage.uploadFile({
      file: req.file,
      path: "files/groups/avatars",
    });

    await groupsAvatarsRepository.update(groupAvatar.id, {
      name: uploadedAvatar.name,
      path: uploadedAvatar.path,
      url: uploadedAvatar.url,
    });

    res.sendStatus(204);
  }
}

export { GroupsController };
