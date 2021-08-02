import { getCustomRepository, Not } from "typeorm";
import { AppError } from "../errors/AppError";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { Time } from "../utils/time";
import { NotificationsService } from "./NotificationsService";

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
        cache: new Time().timeToMS(1, "hour"),
      });

      if (!participant) {
        throw new Error("Participant not found");
      }

      return participant;
    } catch (error) {
      new Error(error);
    }
  }

  async new({ group_id, user_id }: INewParticipant) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const notificationsService = new NotificationsService()

    if (!group_id) {
      throw new AppError("Group ID not provided");
    }

    const existsParticipant = await participantsRepository.findOne({
      where: { group_id, user_id },
      relations: ["group"],
    });

    if (existsParticipant) {
      return existsParticipant;
    }

    const createdParticipant = participantsRepository.create({
      user_id,
      group_id,
    });

    await participantsRepository.save(createdParticipant);
    const participant = await participantsRepository.findOne(
      createdParticipant.id,
      {
        relations: ["group", "user"],
      }
    );

    const owner = await participantsRepository.find({
      where: { group_id, user_id: participant.group.owner_id }
    })
    const notificationsTokens = await notificationsService.getNotificationsTokens({
      usersID: owner.map(data => data.user_id)
    })

    await notificationsService.send({
      tokens: notificationsTokens,
      message: {
        content: {
          title: participant.group.name,
          body: `🆕 ${participant.user.name} entrou no grupo.`
        }
      },
      channelId: "default",
      data: participant,
      priority: "high",
    })

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
