import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import * as Yup from "yup";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { AvatarsRepository } from "../repositories/AvatarsRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import { StorageManager, UploadedFile } from "../services/StorageManager";
import { ImageProcessor } from "../utils/imageProcessor";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { FriendsRepository } from "../repositories/FriendsRepository";
import { FriendsState } from "../database/enums/friends";
import { GroupType } from "../database/enums/groups";
import { ParticipantsService } from "../services/ParticipantsService";
import { ParticipantState } from "../database/enums/participants";

interface Data {
  name: string;
  email: string;
  password: string;
  avatar?: {
    url: string;
    name: string;
    path: string;
  };
}
class UsersController {
  async create(req: Request, res: Response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    const { name, email, password } = req.body as Data;
    const avatar = req.file;
    const imageProcessor = new ImageProcessor();
    let processedImage: Buffer;

    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
      throw new AppError(error);
    }

    const usersRepository = getCustomRepository(UsersRepository);
    const userAlreadyExists = await usersRepository.findOne({
      email,
    });

    if (userAlreadyExists) {
      throw new AppError("User already exists!");
    }

    const data: Data = {
      name: name.trim(),
      email,
      password: await bcrypt.hash(password, 12),
    };

    if (avatar) {
      processedImage = await imageProcessor.avatar({
        avatar: avatar.buffer,
        quality: 60,
      });
      avatar.buffer = processedImage;

      const storage = new StorageManager();
      const uploadedAvatar = (await storage.uploadFile({
        file: avatar,
        path: "files/users/avatars",
      })) as UploadedFile;

      data.avatar = {
        url: uploadedAvatar.url,
        name: uploadedAvatar.name,
        path: uploadedAvatar.path,
      };
    }
    const user = usersRepository.create({ ...data });
    await usersRepository.save(user);
    user.password = undefined;

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY);

    return res.status(200).json({ user, token });
  }

  async me(req: RequestAuthenticated, res: Response) {
    const usersRepository = getCustomRepository(UsersRepository);
    const friendsRepository = getCustomRepository(FriendsRepository);
    const participantsService = new ParticipantsService();

    let user = await usersRepository.findOne({
      where: { id: req.userId },
      loadEagerRelations: true,
      relations: ["groups"],
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const friendsAmount = await friendsRepository.count({
      where: [
        { requested_by_id: user.id, state: FriendsState.FRIENDS },
        { received_by_id: user.id, state: FriendsState.FRIENDS },
      ],
    });

    if (user.groups) {
      user.groups = await Promise.all(
        user.groups.filter(async (group) => {
          if (group.type !== GroupType.DIRECT) {
            const hasParticipant = await participantsService.index(
              user.id,
              group.id
            );
            if (hasParticipant) {
              if (hasParticipant.state === ParticipantState.JOINED) {
                return true;
              }
            }
          }

          return false;
        })
      );
    }

    user = Object.assign(user, {
      friendsAmount,
    });

    return res.json(user);
  }

  async index(req: RequestAuthenticated, res: Response) {
    const id = req.query.user_id || req.userId;

    const usersRepository = getCustomRepository(UsersRepository);
    const friendsRepository = getCustomRepository(FriendsRepository);
    const participantsService = new ParticipantsService();

    let user = await usersRepository.findOne(String(id), {
      relations: ["avatar", "participating"],
    });

    if (!user) {
      throw new AppError("User not found");
    }

    if (user.id !== req.userId) {
      const existsFriendRequest = await friendsRepository.findOne({
        where: [
          {
            requested_by_id: req.userId,
            received_by_id: user.id,
          },
          {
            requested_by_id: user.id,
            received_by_id: req.userId,
          },
        ],
        loadEagerRelations: true,
      });

      if (existsFriendRequest) {
        user = Object.assign(user, {
          friend: existsFriendRequest,
        });
      }
    }

    if (user.id === req.userId) {
      const friendsAmount = await friendsRepository.count({
        where: [
          { requested_by_id: user.id, state: FriendsState.FRIENDS },
          { received_by_id: user.id, state: FriendsState.FRIENDS },
        ],
      });
      user = Object.assign(user, {
        friendsAmount,
      });
    }

    if (user.groups) {
      user.groups = await Promise.all(
        user.groups.filter(async (group) => {
          if (group.type !== GroupType.DIRECT) {
            const hasParticipant = await participantsService.index(
              user.id,
              group.id
            );
            if (hasParticipant) {
              if (hasParticipant.state === ParticipantState.JOINED) {
                return true;
              }
            }
          }

          return false;
        })
      );
    }

    return res.status(200).json(user);
  }

  async delete(req: RequestAuthenticated, res: Response) {
    const id = req.userId;
    const usersRepository = getCustomRepository(UsersRepository);
    const avatarsRepository = getCustomRepository(AvatarsRepository);

    const user = await usersRepository.findOne(id, { relations: ["avatar"] });

    if (!user) {
      throw new AppError("User not found!");
    }

    if (user.id !== id) {
      throw new AppError("User not authorized for this action!", 403);
    }

    const storage = new StorageManager();
    await storage.deleteFile(user.avatar.path);

    await avatarsRepository.delete(user.avatar.id);
    await usersRepository.delete(user.id);

    return res.status(204).send();
  }

  async update(req: RequestAuthenticated, res: Response) {
    const body = req.body;
    const userID = req.userId;
    const usersRepository = getCustomRepository(UsersRepository);
    const schema = Yup.object().shape({
      name: Yup.string().max(100).required(),
      bio: Yup.string().max(100),
    });

    let dataValidated: { name: string; bio: string };

    try {
      dataValidated = await schema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (error) {
      throw new AppError(error.errors);
    }

    dataValidated.name = dataValidated.name.trim();

    const user = await usersRepository.findOne({
      where: [{ id: userID }],
    });

    if (!user) {
      throw new AppError("Invalid user");
    }

    const updatedUserData = Object.assign(user, dataValidated);
    const mergedUser = usersRepository.merge(user, updatedUserData);
    const savedFile = await usersRepository.save(mergedUser);

    return res.json({ user: savedFile });
  }

  async updateAvatar(req: RequestAuthenticated, res: Response) {
    const avatar = req.file;
    const storage = new StorageManager();
    const imageProcessor = new ImageProcessor();

    const avatarsRepository = getCustomRepository(AvatarsRepository);
    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findOne(req.userId);
    let processedImage: Buffer;
    processedImage = await imageProcessor.avatar({
      avatar: req.file.buffer,
      quality: 60,
    });

    req.file.buffer = processedImage;

    if (!user || !avatar) {
      throw new AppError("Invalid user or avatar not provided");
    }

    const userAvatar = await avatarsRepository.findOne(
      user.avatar ? user.avatar.id : ""
    );
    const uploadedAvatar = await storage.uploadFile({
      file: req.file,
      path: "files/users/avatars",
    });
    
    if (!userAvatar) {
      const createdAvatar = avatarsRepository.create({
        name: uploadedAvatar.name,
        path: uploadedAvatar.path,
        url: uploadedAvatar.url,
      });

      await avatarsRepository.save(createdAvatar);
      await usersRepository.update(user.id, {
        avatar: createdAvatar,
      });

      const updatedUser = await usersRepository.findOne(user.id, {
        relations: ["avatar"],
      });

      return res.json({ user: updatedUser });
    }

    await storage.deleteFile(userAvatar.path);
    await avatarsRepository.update(userAvatar.id, {
      name: uploadedAvatar.name,
      path: uploadedAvatar.path,
      url: uploadedAvatar.url,
    });

    const updatedUser = await usersRepository.findOne(user.id, {
      relations: ["avatar"],
    });

    return res.json({ user: updatedUser });
  }
}

export { UsersController };
