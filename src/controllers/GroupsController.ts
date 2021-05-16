import { getCustomRepository } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { Request, Response } from "express";
import { avatarProcessor } from "../utils/avatarProcessor";
import { StorageManager, UploadedFile } from "../services/StorageManager";

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
  async create(req: Request, res: Response) {
    const body = req.body;
    const groupAvatar = req.file;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const schema = Yup.object().shape({
      name: Yup.string().max(100).required(),
      description: Yup.string().max(500).required(),
      privacy: Yup.string().uppercase().required(),
      owner_id: Yup.string().required(),
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
      owner_id: body.owner_id,
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
        inLocal: process.env.NODE_ENV === "development" ? true : false,
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
    return res.status(200).json(group);
  }
  async index(req: Request, res: Response) {
    const { id } = req.params;
    const groupsRepository = getCustomRepository(GroupsRepository);

    if (!id) {
      throw new AppError("Group ID not provided!");
    }

    const group = await groupsRepository.findOne(id, {
      relations: ["owner", "group_avatar"],
    });

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    return res.status(200).json(group);
  }
  // async delete()
}

export { GroupsController };
