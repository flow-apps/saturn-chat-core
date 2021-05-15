import { getCustomRepository } from "typeorm";
import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { Request, Response } from "express";
import { UsersRepository } from "../repositories/UsersRepository";

class GroupsController {
  async create(req: Request, res: Response) {
    const body = req.body;
    const groupsRepository = getCustomRepository(GroupsRepository);
    const usersRepository = getCustomRepository(UsersRepository);
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

    const group = groupsRepository.create({
      name: body.name,
      description: body.description,
      privacy: String(body.privacy).toUpperCase(),
      owner_id: body.owner_id,
    });

    await groupsRepository.save(group);
    return res.status(200).json(group);
  }
  async index(req: Request, res: Response) {
    const { id } = req.params;
    const groupsRepository = getCustomRepository(GroupsRepository);

    if (!id) {
      throw new AppError("Group ID not provided!");
    }

    const group = await groupsRepository.findOne(id, { relations: ["owner"] });

    if (!group) {
      throw new AppError("Group not found", 404);
    }

    return res.status(200).json(group);
  }
  // async delete()
}

export { GroupsController };
