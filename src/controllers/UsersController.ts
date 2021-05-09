import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { UsersRepository } from "../repositories/UsersRepository";
import bcrypt from "bcryptjs";
import { imageProcessor } from "../utils/imageProcessor";

class UsersController {
  async create(req: Request, res: Response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    const { name, email, password } = req.body;
    const avatar = req.file;
    console.log(avatar);

    let processedImage: Buffer;

    if (avatar) {
      processedImage = await imageProcessor(avatar.buffer);
    }

    console.log(processedImage);

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

    await usersRepository.save(user);
    user.password = undefined;

    return res.json(user);
  }
}

export { UsersController };
