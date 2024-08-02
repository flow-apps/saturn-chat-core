import { Response } from "express";
import { getCustomRepository, In } from "typeorm";
import { GroupType } from "../database/enums/groups";
import {
  ParticipantRole,
  ParticipantState,
} from "../database/enums/participants";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { NotificationsService } from "../services/NotificationsService";
import { ParticipantsService } from "../services/ParticipantsService";
import { io } from "../websockets";

import { ONESIGNAL } from "../configs.json";

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
    const { participant_id } = req.query;
    const participantsRepository = getCustomRepository(ParticipantsRepository);

    if (!group_id) {
      throw new AppError("Group ID not provided");
    }

    const participant =
      await participantsRepository.findParticipantWithPremiumField({
        where: [{ id: participant_id }, { group_id, user_id: req.userId }],
        cache: 50000,
      });

    if (!participant) {
      throw new AppError("Participant not found");
    }

    return res.status(200).json({ participant });
  }

  async list(req: RequestAuthenticated, res: Response) {
    const participantsService = new ParticipantsService();

    const { group_id, _limit, _page } = req.query;
    const groupID = String(group_id);
    const limit = parseInt(String(_limit));
    const page = parseInt(String(_page));

    if (!groupID) {
      throw new AppError("Group ID not provided");
    }

    const participants = await participantsService.list(groupID, page, limit);
    return res.status(200).json(participants);
  }

  async delete(req: RequestAuthenticated, res: Response) {
    const { id } = req.params;
    const notificationsService = new NotificationsService();
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsService = new ParticipantsService();

    const group = await groupsRepository.findOne(id);
    const hasParticipant = await participantsRepository.findOne({
      where: { user_id: req.userId, group_id: id },
      relations: ["user"],
    });

    if (!hasParticipant) {
      throw new AppError("Participant not found", 404);
    }

    if (hasParticipant.user_id === group.owner_id) {
      throw new AppError("Participant not found", 404);
    }

    await participantsService.exit(hasParticipant.id, ParticipantState.EXITED);
    await notificationsService.send({
      name: "Exit Participant Notification",
      tokens: [group.owner_id],
      message: {
        headings: {
          en: group.name,
        },
        contents: {
          pt: `😥 ${hasParticipant.user.name} saiu do grupo!`,
          en: `😥 ${hasParticipant.user.name} left the group!`,
        },
      },
    });

    return res.sendStatus(204);
  }

  async kick(req: RequestAuthenticated, res: Response) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsService = new ParticipantsService();
    const notificationsService = new NotificationsService();
    const { participant_id } = req.params;
    const query = req.query as { [key: string]: string };
    const userID = req.userId;

    const authorizedRoles = [
      ParticipantRole.MODERATOR,
      ParticipantRole.ADMIN,
      ParticipantRole.OWNER,
    ];

    if (!participant_id) {
      throw new AppError("Participant ID not provided");
    }

    const group = await groupsRepository.findOne({
      where: { id: query.group_id, type: GroupType.GROUP },
    });

    if (!group) {
      throw new AppError("Invalid Group provided");
    }

    const requestedBy = await participantsRepository.findOne({
      where: { user_id: userID, group_id: group.id },
    });

    if (!requestedBy || !authorizedRoles.includes(requestedBy.role)) {
      throw new AppError("Action not authorized for this user", 403);
    }

    const kickedUser = await participantsRepository.findOne(participant_id, {
      relations: ["user"],
    });

    if (!kickedUser) {
      throw new AppError("Participant not found for kick");
    }

    await participantsService.exit(kickedUser.id, ParticipantState.KICKED);

    if (query.notify === "yes") {
      await notificationsService.send({
        name: "Exit Participant Notification",
        tokens: [kickedUser.user_id],
        android_channel_id: ONESIGNAL.CHANNELS_IDS.BAN_AND_KICK,
        message: {
          headings: {
            en: group.name,
          },
          contents: {
            pt: `👮‍♂️ Você foi expulso do grupo!`,
            en: `👮‍♂️ You are kicked of group!`,
          },
        },
      });
    }

    io.to(kickedUser.user_id).emit("kicked_group", {
      group_id: group.id,
      user_id: kickedUser.id,
    });
    io.socketsLeave(group.id);

    return res.sendStatus(204);
  }

  async ban(req: RequestAuthenticated, res: Response) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const groupsRepository = getCustomRepository(GroupsRepository);
    const notificationsService = new NotificationsService();
    const participantsService = new ParticipantsService();
    const { participant_id } = req.params;
    const query = req.query as { [key: string]: string };
    const userID = req.userId;

    const authorizedRoles = [
      ParticipantRole.MODERATOR,
      ParticipantRole.ADMIN,
      ParticipantRole.OWNER,
    ];

    if (!participant_id) {
      throw new AppError("Participant ID not provided");
    }

    const group = await groupsRepository.findOne({
      where: { id: query.group_id, type: GroupType.GROUP },
    });

    if (!group) {
      throw new AppError("Invalid Group provided");
    }

    const requestedBy = await participantsRepository.findOne({
      where: { user_id: userID, group_id: group.id },
    });

    if (!requestedBy || !authorizedRoles.includes(requestedBy.role)) {
      throw new AppError("Action not authorized for this user", 403);
    }

    const bannedUser = await participantsRepository.findOne(participant_id, {
      relations: ["user"],
    });

    if (!bannedUser) {
      throw new AppError("Participant not found for ban");
    }

    await participantsService.exit(bannedUser.id, ParticipantState.BANNED);

    if (query.notify === "yes") {
      await notificationsService.send({
        name: "Exit Participant Notification",
        tokens: [bannedUser.user_id],
        android_channel_id: ONESIGNAL.CHANNELS_IDS.BAN_AND_KICK,
        message: {
          headings: {
            en: group.name,
          },
          contents: {
            pt: `👮‍♂️ Você foi banido do grupo!`,
            en: `👮‍♂️ You are banned of group!`,
          },
        },
      });
    }

    io.to(bannedUser.user_id).emit("banned_group", {
      group_id: group.id,
      user_id: bannedUser.user_id,
    });
    io.socketsLeave(group.id);

    return res.sendStatus(204);
  }

  async setRole(req: RequestAuthenticated, res: Response) {
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const { participant_id } = req.params;
    const query = req.query;
    const authorizedRoles = [
      ParticipantRole.ADMIN,
      ParticipantRole.MANAGER,
      ParticipantRole.OWNER,
    ];

    const requestedByParticipant = await participantsRepository.findOne({
      where: [
        {
          user_id: req.userId,
          group_id: query.group_id,
          state: ParticipantState.JOINED,
          role: In(authorizedRoles),
        },
      ],
      relations: ["group"],
    });

    if (requestedByParticipant.group.type === GroupType.DIRECT) {
      throw new AppError("Group not is valid for this action", 403);
    }

    if (!requestedByParticipant) {
      throw new AppError("Requested by invalid participant");
    }

    const forParticipant = await participantsRepository.findOne(participant_id);

    if (!forParticipant) {
      throw new AppError("Participant not found");
    }

    switch (query.role) {
      case ParticipantRole.PARTICIPANT:
        await participantsRepository.update(forParticipant.id, {
          role: ParticipantRole.PARTICIPANT,
        });
        return res.sendStatus(204);
      case ParticipantRole.MODERATOR:
        await participantsRepository.update(forParticipant.id, {
          role: ParticipantRole.MODERATOR,
        });
        return res.sendStatus(204);
      case ParticipantRole.MANAGER:
        await participantsRepository.update(forParticipant.id, {
          role: ParticipantRole.MANAGER,
        });
        return res.sendStatus(204);
      case ParticipantRole.ADMIN:
        await participantsRepository.update(forParticipant.id, {
          role: ParticipantRole.ADMIN,
        });
        return res.sendStatus(204);
      default:
        throw new AppError("Invalid role provided");
    }
  }
}

export { ParticipantsController };
