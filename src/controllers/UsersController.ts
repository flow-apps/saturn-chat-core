import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { UsersRepository } from "../repositories/UsersRepository";
import bcrypt from "bcryptjs";
import { avatarProcessor } from "../utils/avatarProcessor";
import { UploadedFile, uploadFile } from "../services/UploadFiles";
import { randomBytes } from "crypto";

interface Data {
  name: string;
  email: string;
  password: string;
  avatar?: {
    url: string;
    name: string;
  };
}
class UsersController {
  async create(req: Request, res: Response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    const { name, email, password } = req.body;
    const avatar = req.file;
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
      name,
      email,
      password: await bcrypt.hash(password, 12),
    };

    if (avatar) {
      processedImage = await avatarProcessor({
        avatar: avatar.buffer,
        quality: 60,
      });
      avatar.buffer = processedImage;

      const extension = avatar.mimetype.split("/")[1];
      const randomString = `${new Date().getTime()}_${randomBytes(10).toString(
        "hex"
      )}`;
      const filename = `avatar_${randomString}.${extension}`;
      const uploadedAvatar = (await uploadFile({
        file: avatar,
        filename,
        inLocal: true,
        path: "avatars",
      })) as UploadedFile;
      data.avatar = { url: uploadedAvatar.url, name: uploadedAvatar.name };
    }
    const user = usersRepository.create({ ...data });
    await usersRepository.save(user);
    user.password = undefined;

    return res.status(200).json(user);
  }

  async index(req: Request, res: Response) {
    const id = req.params;

    if (!id) {
      throw new AppError("User ID not provided");
    }

    const usersRepository = getCustomRepository(UsersRepository);
    const user = await usersRepository.findOne(id, { relations: ["avatar"] });

    if (!user) {
      throw new AppError("User not found");
    }

    return res.status(200).json(user);
  }
}

export { UsersController };
