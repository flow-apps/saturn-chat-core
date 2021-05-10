import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { UsersRepository } from "../repositories/UsersRepository";
import bcrypt from "bcryptjs";
import { avatarProcessor } from "../utils/avatarProcessor";
import { uploadFile } from "../services/UploadFiles";
import { randomBytes } from "crypto";

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

    const user = usersRepository.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
    });

    if (userAlreadyExists) {
      throw new AppError("User already exists!");
    }

    if (avatar) {
      processedImage = await avatarProcessor({
        avatar: avatar.buffer,
        quality: 50,
      });

      avatar.buffer = processedImage;

      const extension = avatar.mimetype.split("/")[1];
      const randomString = `${new Date().getTime()}_${randomBytes(10).toString(
        "hex"
      )}`;
      const filename = `avatar_${randomString}.${extension}`;
      const uploadedAvatar = await uploadFile({
        file: avatar,
        filename,
        inLocal: true,
        path: "avatars",
      });
    }

    await usersRepository.save(user);
    user.password = undefined;

    return res.json(user);
  }
}

export { UsersController };
