import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";

interface INewParticipant {
  user_id: string;
  group_id: string;
}

class ParticipantsService {
  async new({ group_id, user_id }: INewParticipant) {
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

    return participant;
  }
}

export { ParticipantsService };
