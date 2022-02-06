import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import * as Yup from "yup";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getCustomRepository } from "typeorm";
import { UsersRepository } from "../repositories/UsersRepository";
import { RequestAuthenticated } from "../middlewares/authProvider";

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

    const userWithAvatar = await userRepository.findOne(user.id, {
      relations: ["avatar"]
    })


    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY);

    return res.status(200).send({ user: userWithAvatar, token });
  }

  async switchPassword(req: RequestAuthenticated, res: Response) {
    const schema = Yup.object().shape({
      currentPass: Yup.string().min(8),
      newPass: Yup.string().min(8)
    })
    const userRepository = getCustomRepository(UsersRepository)

    try {
      await schema.validate(req.body, { abortEarly: false })
    } catch (error) {
      throw new AppError(error)
    }

    const user = await userRepository
    .createQueryBuilder("user")
    .where("user.id = :id", { id: req.userId })
    .addSelect("user.password")
    .getOne();

    if (!user)
      throw new AppError("User not found", 404)

    if (!(await bcrypt.compare(req.body.currentPass, user.password)))
      throw new AppError("User password incorrect", 403)

    const newPassHash = await bcrypt.hash(req.body.newPass, 12)
    await userRepository.update(req.userId, { password: newPassHash })

    return res.sendStatus(204)
  }
}

export { AuthController };
