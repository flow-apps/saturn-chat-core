import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";
import { NotificationsService } from "../services/NotificationsService";
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
    const { id } = req.params
    const notificationsService = new NotificationsService()
    const participantsRepository = getCustomRepository(ParticipantsRepository)
    const groupsRepository = getCustomRepository(GroupsRepository)
    const usersNotificationsRepository = getCustomRepository(UserNotificationsRepository)

    const group = await groupsRepository.findOne(id)
    const hasParticipant = await participantsRepository.findOne({
      where: { user_id: req.userId, group_id: id },
      relations: ["user"]
    })

    if (!hasParticipant) {
      throw new AppError("Participant not found", 404)
    }


    if (hasParticipant.user_id === group.owner_id) {
      throw new AppError("Participant not found", 404)
    }

    const notification = await usersNotificationsRepository.findOne({
      where: { user_id: group.owner_id, is_revoked: false },
      select: ["notification_token"]
    })
    await participantsRepository.remove(hasParticipant)
    await notificationsService.send({
      tokens: [notification.notification_token],
      message: {
        content: {
          title: group.name,
          body: `😥 ${hasParticipant.user.name} saiu do grupo!`
        }
      },
    })

    return res.sendStatus(204)
  }
}

export { ParticipantsController };
