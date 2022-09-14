import { getCustomRepository, In, Not } from "typeorm";
import { GroupType } from "../database/enums/groups";
import { InviteType } from "../database/enums/invites";
import {
  ParticipantRole,
  ParticipantState,
} from "../database/enums/participants";
import { Participant } from "../entities/Participant";
import { AppError } from "../errors/AppError";
import { InvitesRepository } from "../repositories/InvitesRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { Time } from "../utils/time";
import { NotificationsService } from "./NotificationsService";

interface INewParticipant {
  user_id: string;
  group_id: string;
  role?: ParticipantRole;
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
        return null
      }

      return participant;
    } catch (error) {
      throw new AppError(error, 500);
    }
  }

  async new({ group_id, user_id, role }: INewParticipant) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const invitesRepository = getCustomRepository(InvitesRepository);
    const notificationsService = new NotificationsService();

    if (!group_id) {
      throw new AppError("Group ID not provided");
    }

    const hasInvite = await invitesRepository.findOne({
      where: { type: InviteType.FRIEND, group_id, received_by_id: user_id },
    });

    if (hasInvite) {
      await invitesRepository.delete(hasInvite.id);
    }

    const existsParticipant = await participantsRepository.findOne({
      where: { group_id, user_id },
      relations: ["group"],
    });

    if (existsParticipant) {
      if (existsParticipant.state === ParticipantState.BANNED) {
        throw new AppError("Participant banned");
      }

      await participantsRepository.update(existsParticipant.id, {
        state: ParticipantState.JOINED,
      });

      existsParticipant.state = ParticipantState.JOINED;
      return existsParticipant;
    }

    const createdParticipant = participantsRepository.create({
      user_id,
      group_id,
      role: role || ParticipantRole.PARTICIPANT,
      state: ParticipantState.JOINED,
    });

    await participantsRepository.save(createdParticipant);
    const participant = await participantsRepository.findOne(
      createdParticipant.id,
      {
        relations: ["group", "user"],
      }
    );

    const owner = await participantsRepository.find({
      where: { group_id, user_id: participant.group.owner_id },
    });
    const notificationsTokens =
      await notificationsService.getNotificationsTokens({
        usersID: owner.map((data) => data.user_id),
      });

    await notificationsService.send({
      tokens: notificationsTokens,
      message: {
        content: {
          title: participant.group.name,
          body: `🆕 ${participant.user.name} entrou no grupo.`,
        },
      },
      channelId: "default",
      data: participant,
      priority: "high",
    });

    return participant;
  }

  async exit(participantID: string, state?: ParticipantState) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    if (!participantID) return new Error("Participant ID not provided");

    const participant = await participantsRepository.findOne({
      where: { id: participantID, state: ParticipantState.JOINED },
    });

    if (!participant) return new Error("Participant not found");

    await participantsRepository.update(participant.id, {
      state: state || ParticipantState.EXITED,
    });

    return;
  }

  async list(groupID: string, _page: number, _limit: number) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const participants = await participantsRepository.find({
      where: [{ group_id: groupID, state: ParticipantState.JOINED }],
      loadEagerRelations: true,
      take: _limit,
      skip: _page * _limit,
      order: { participating_since: "ASC" },
    });

    return participants;
  }
}

export { ParticipantsService };
