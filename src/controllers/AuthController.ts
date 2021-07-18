import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import * as Yup from "yup";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getCustomRepository } from "typeorm";
import { UsersRepository } from "../repositories/UsersRepository";

class AuthController {
  async authenticate(req: Request, res: Response) {
    const body = req.body;
    const userRepository = getCustomRepository(UsersRepository);
    const schema = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
      console.log(error);
      throw new AppError(error);
    }
    const user = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: body.email })
      .addSelect("user.password")
      .getOne();

    if (!user) {
      throw new AppError("User not found!", 404);
    }

    if (!(await bcrypt.compare(body.password, user.password))) {
      console.log("Auth >> Password incorrect");
      throw new AppError("Failed on authenticate!");
    }

    user.password = undefined;

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY);

    return res.status(200).send({ user, token });
  }
}

export { AuthController };
