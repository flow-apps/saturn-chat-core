import { Request, Response } from "express";
import { getCustomRepository, ILike, Not, Raw } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsAvatarsRepository } from "../repositories/GroupsAvatarsRepository";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { ReadMessagesRepository } from "../repositories/ReadMessagesRepository";
import { ParticipantsService } from "../services/ParticipantsService";
import { StorageManager, UploadedFile } from "../services/StorageManager";
import { ImageProcessor } from "../utils/imageProcessor";
import { v4 as uuid } from "uuid";
import { GroupAvatar } from "../entities/GroupAvatar";
import {
  ParticipantRole,
  ParticipantState,
} from "../database/enums/participants";

interface Body {
  name: string;
  description: string;
  privacy: string;
  tags?: string;
}

interface Data {
  id: string;
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
      description: Yup.string().max(500),
      privacy: Yup.string().uppercase().required(),
      tags: Yup.string(),
    });
    const groupID = uuid();

    try {
      await schema.validate(body, { abortEarly: false });
    } catch (error) {
      throw new AppError(error);
    }

    const data: Data = {
      id: groupID,
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
    let createdAvatar: GroupAvatar;

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

      createdAvatar = groupsAvatarsRepository.create({
        name: uploadedAvatar.name,
        path: uploadedAvatar.path,
        url: uploadedAvatar.url,
        group_id: groupID,
      });
    }

    const group = groupsRepository.create(data);
    await groupsRepository.save(group);

    if (createdAvatar) {
      await groupsAvatarsRepository.save(createdAvatar);
      await groupsRepository.update(group.id, {
        group_avatar: createdAvatar,
      });
    }

    await participants.new({
      group_id: group.id,
      user_id: req.userId,
      role: ParticipantRole.OWNER,
    });
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

    const participantsAmount = await participantsRepository.count({
      where: { group_id: group.id, state: ParticipantState.JOINED },
    });

    const groupWithParticipantsAmount = Object.assign(group, {
      participantsAmount,
    });

    return res.status(200).json(groupWithParticipantsAmount);
  }

  async delete(req: RequestAuthenticated, res: Response) {
    const { id } = req.params;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const authorizedRoles = [ParticipantRole.ADMIN, ParticipantRole.OWNER];

    if (!id) {
      throw new AppError("Group ID not provided!");
    }

    const group = await groupsRepository.findOne(id, {
      relations: ["group_avatar"],
      cache: 5000,
    });
    const requestedBy = await participantsRepository.findOne({
      where: { user_id: req.userId, group_id: id },
    });
    const isAuthorized = authorizedRoles.includes(requestedBy.role);

    if (!group) {
      throw new AppError("Group not found!", 404);
    }

    if (!isAuthorized) {
      throw new AppError("User not authorized for this action!", 403);
    }

    await groupsRepository.remove(group);
    return res.sendStatus(204);
  }

  async list(req: RequestAuthenticated, res: Response) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const messagesRepository = getCustomRepository(MessagesRepository);
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository);

    const participating = await participantsRepository.find({
      where: { user_id: req.userId, state: ParticipantState.JOINED },
      loadEagerRelations: true,
    });

    const groupsWithUnreadMessages = await Promise.all(
      participating.map(async (participant) => {
        const totalMessages = await messagesRepository.count({
          where: { group_id: participant.group.id },
        });
        const allReadMessages = await readMessagesRepository.count({
          where: { user_id: req.userId, group_id: participant.group.id },
        });

        const totalUnreadMessages = totalMessages - allReadMessages;
        const groupWithUnreadMessages = Object.assign(participant.group, {
          unreadMessagesAmount: totalUnreadMessages,
        });

        return groupWithUnreadMessages;
      })
    );

    return res.status(200).json(groupsWithUnreadMessages);
  }

  async search(req: RequestAuthenticated, res: Response) {
    const { q, _limit, _page } = req.query;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);

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

    const groupsWithParticipantsAmount = await Promise.all(
      groups.map(async (group) => {
        const participantsAmount = await participantsRepository.count({
          where: { group_id: group.id },
        });
        return Object.assign(group, {
          participantsAmount,
        });
      })
    );

    return res.status(200).json(groupsWithParticipantsAmount);
  }

  async update(req: RequestAuthenticated, res: Response) {
    const body = req.body as Body;
    const groupID = req.params.groupID;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const schema = Yup.object().shape({
      name: Yup.string().max(100).required(),
      description: Yup.string().max(500),
      privacy: Yup.string().uppercase().required(),
      tags: Yup.string(),
    });
    const authorizedRoles = [
      ParticipantRole.ADMIN,
      ParticipantRole.MANAGER,
      ParticipantRole.OWNER,
    ];

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
      where: [{ id: groupID }],
    });
    const requestedBy = await participantsRepository.findOne({
      where: { user_id: req.userId, group_id: group.id },
    });

    if (!group) {
      throw new AppError("Invalid group");
    }

    if (!authorizedRoles.includes(requestedBy.role)) {
      throw new AppError("User not authorized for this action", 403);
    }

    dataValidated.tags = dataValidated.tags
      ? dataValidated.tags
          .trim()
          .toLowerCase()
          .split(",")
          .map((tag) => tag.trim())
      : [];
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
    const authorizedRoles = [
      ParticipantRole.ADMIN,
      ParticipantRole.MANAGER,
      ParticipantRole.OWNER,
    ];

    const groupsAvatarsRepository = getCustomRepository(
      GroupsAvatarsRepository
    );
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    let processedImage: Buffer;

    const group = await groupsRepository.findOne({
      where: { id: groupID },
      relations: ["group_avatar"],
    });
    const requestedBy = await participantsRepository.findOne({
      where: { user_id: req.userId, group_id: group.id },
    });

    if (!group || !avatar) {
      throw new AppError("Invalid Group or Avatar provided");
    }

    if (!authorizedRoles.includes(requestedBy.role)) {
      throw new AppError("User not authorized for this action", 403);
    }

    const groupAvatar = await groupsAvatarsRepository.findOne(
      group.group_avatar ? group.group_avatar.id : ""
    );

    processedImage = await imageProcessor.avatar({
      avatar: req.file.buffer,
      quality: 60,
    });

    req.file.buffer = processedImage;
    const uploadedAvatar = await storage.uploadFile({
      file: req.file,
      path: "files/groups/avatars",
    });

    if (!groupAvatar) {
      const createdAvatar = groupsAvatarsRepository.create({
        name: uploadedAvatar.name,
        path: uploadedAvatar.path,
        url: uploadedAvatar.url,
        group_id: groupID,
      });

      await groupsAvatarsRepository.save(createdAvatar);
      await groupsRepository.update(group.id, {
        group_avatar: createdAvatar,
      });

      return res.sendStatus(204);
    }

    await storage.deleteFile(groupAvatar.path);

    await groupsAvatarsRepository.update(groupAvatar.id, {
      name: uploadedAvatar.name,
      path: uploadedAvatar.path,
      url: uploadedAvatar.url,
    });

    return res.sendStatus(204);
  }
}

export { GroupsController };
