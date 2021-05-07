import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { UsersRepository } from "../repositories/UsersRepository";

class UsersController {
  async create(req: Request, res: Response) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required(),
      avatar: Yup.string(),
    });
    const { email } = req.body;

    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
      throw new AppError(error);
    }

    const usersRepository = getCustomRepository(UsersRepository);
    const userAlreadyExists = await usersRepository.findOne({
      email,
    });
    const user = usersRepository.create(req.body);

    if (userAlreadyExists) {
      throw new AppError("User already exists!");
    }

    await usersRepository.save(user);
    return res.json(user);
  }
}

export { UsersController };
