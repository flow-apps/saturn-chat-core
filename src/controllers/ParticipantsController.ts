import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";

class ParticipantsController {
  async new(req: RequestAuthenticated, res: Response) {
    const { group_id } = req.params;
    const user_id = req.userId;
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    if (!group_id) {
      throw new AppError("Group ID not provided");
    }

    const createdParticipant = participantsRepository.create({
      user_id,
      group_id,
    });

    await participantsRepository.save(createdParticipant);

    const participant = await participantsRepository.findOne(
      createdParticipant.id,
      {
        relations: ["group"],
      }
    );

    return res.status(200).json({ participant });
  }
}

export { ParticipantsController };
