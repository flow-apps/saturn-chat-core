import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { ParticipantsService } from "../services/ParticipantsService";

class ParticipantsController {
  async new(req: RequestAuthenticated, res: Response) {
    const { group_id } = req.params;
    const participants = new ParticipantsService();
    const participant = await participants.new({
      group_id,
      user_id: req.userId,
    });

    if (!participant) {
      throw new AppError("Error on create new participant");
    }

    return res.status(200).json({ participant });
  }

  async index(req: RequestAuthenticated, res: Response) {
    const { group_id } = req.params;
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    if (!group_id) {
      throw new AppError("Group ID not provided");
    }

    const participant = await participantsRepository.findOne({
      where: { group_id, user_id: req.userId },
    });

    if (!participant) {
      throw new AppError("Participant not found");
    }

    return res.status(200).json({ participant });
  }
}

export { ParticipantsController };
