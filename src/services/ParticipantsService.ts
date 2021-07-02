import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";

interface INewParticipant {
  user_id: string;
  group_id: string;
}

class ParticipantsService {
  async index(userID: string, groupID: string) {
    try {
      const participantsRepository = getCustomRepository(
        ParticipantsRepository
      );
      const participant = await participantsRepository.findOne({
        where: [{ user_id: userID, group_id: groupID }],
        cache: 5000,
      });

      return participant;
    } catch (error) {
      new Error(error);
    }
  }

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

  async exit(participantID: string) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    if (!participantID) return new Error("Participant ID not provided");

    return await participantsRepository.delete(participantID);
  }

  async list(groupID: string, _page: number, _limit: number) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const participants = await participantsRepository.find({
      where: [{ group_id: groupID }],
      loadEagerRelations: true,
      take: _limit,
      skip: _page * _limit,
      order: { participating_since: "ASC" },
    });

    return participants;
  }
}

export { ParticipantsService };
