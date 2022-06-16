import { Response } from "express";
import { getCustomRepository, In, Not } from "typeorm";
import { FriendsState } from "../database/enums/friends";
import { GroupType } from "../database/enums/groups";
import { ParticipantRole } from "../database/enums/participants";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { FriendsRepository } from "../repositories/FriendsRepository";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { ReadMessagesRepository } from "../repositories/ReadMessagesRepository";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import { NotificationsService } from "../services/NotificationsService";
import { ParticipantsService } from "../services/ParticipantsService";

class FriendsController {
  async list(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const messagesRepository = getCustomRepository(MessagesRepository);
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository);

    const friends = await friendsRepository.find({
      where: [
        { state: FriendsState.FRIENDS, requested_by_id: req.userId },
        { state: FriendsState.FRIENDS, received_by_id: req.userId },
      ],
      loadEagerRelations: true,
    });

    const friendsWithUnreadMessages = await Promise.all(
      friends.map(async (friend) => {
        const totalMessages = await messagesRepository.count({
          where: { group_id: friend.chat_id },
        });
        const allReadMessages = await readMessagesRepository.count({
          where: { user_id: req.userId, group_id: friend.chat_id },
        });

        const totalUnreadMessages = totalMessages - allReadMessages;
        const friendWithUnreadMessages = Object.assign(friend, {
          unreadMessagesAmount: totalUnreadMessages,
        });

        return friendWithUnreadMessages;
      })
    );

    return res.json(friendsWithUnreadMessages);
  }

  async listRequests(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const requests = await friendsRepository.find({
      where: [{ state: FriendsState.REQUESTED, received_by_id: req.userId }],
      loadEagerRelations: true,
    });

    return res.json(requests);
  }

  async request(req: RequestAuthenticated, res: Response) {
    const usersRepository = getCustomRepository(UsersRepository);
    const friendsRepository = getCustomRepository(FriendsRepository);
    const userNotificationsRepository = getCustomRepository(
      UserNotificationsRepository
    );
    const notificationsService = new NotificationsService();
    const friendID = req.query.friend_id as string;
    const userID = req.userId;

    if (!friendID) throw new AppError("Friend ID not provided", 404);

    const { notification_token } = await userNotificationsRepository.findOne({
      where: { is_revoked: false, send_notification: true, user_id: friendID },
    });

    const existsRequest = await friendsRepository.findOne({
      where: [
        {
          requested_by_id: userID,
          received_by_id: friendID,
          state: In([
            FriendsState.REQUESTED,
            FriendsState.UNFRIENDS,
            FriendsState.FRIENDS,
          ]),
        },
        {
          requested_by_id: friendID,
          received_by_id: userID,
          state: In([
            FriendsState.REQUESTED,
            FriendsState.UNFRIENDS,
            FriendsState.FRIENDS,
          ]),
        },
      ],
    });

    if (existsRequest) {
      if (existsRequest.state === FriendsState.UNFRIENDS) {
        await friendsRepository.update(existsRequest.id, {
          state: FriendsState.REQUESTED,
        });

        if (notification_token) {
          const requestedBy = await usersRepository.findOne(userID);

          await notificationsService.send({
            tokens: [notification_token],
            message: {
              content: {
                title: `👥 ${requestedBy.name} quer ser seu amigo`,
                body: "Clique aqui para aceitar ou recusar",
              },
            },
          });
        }

        return res.json({ ...existsRequest, state: FriendsState.REQUESTED });
      }

      throw new AppError("Friend request already exists");
    }

    const createdFriendRequest = friendsRepository.create({
      requested_by_id: userID,
      received_by_id: friendID,
      state: FriendsState.REQUESTED,
    });

    await friendsRepository.save(createdFriendRequest);

    if (notification_token) {
      const requestedBy = await usersRepository.findOne(userID);

      await notificationsService.send({
        tokens: [notification_token],
        message: {
          content: {
            title: `👥 ${requestedBy.name} quer ser seu amigo`,
            body: "Clique aqui para aceitar ou recusar",
          },
        },
      });
    }

    return res.json(createdFriendRequest);
  }

  async response(req: RequestAuthenticated, res: Response) {
    const participantsService = new ParticipantsService();
    const groupsRepository = getCustomRepository(GroupsRepository);
    const friendsRepository = getCustomRepository(FriendsRepository);
    const { state, friend_id } = req.query;

    const friendRequest = await friendsRepository.findOne(String(friend_id));

    if (!friendRequest) {
      throw new AppError("Friend request not found", 404);
    }

    if (friendRequest.received_by_id !== req.userId) {
      throw new AppError("User not authorized for this action", 403);
    }

    if (state === "REJECT") {
      await friendsRepository.delete(String(friend_id));
    }

    if (state === "ACCEPT") {
      const group = groupsRepository.create({
        name: `direct_chat_${friend_id}`,
        description: `direct_chat`,
        privacy: "PRIVATE",
        owner_id: friendRequest.requested_by_id,
        type: GroupType.DIRECT,
        tags: [],
      });
      await groupsRepository.save(group);
      await participantsService.new({
        group_id: group.id,
        user_id: friendRequest.requested_by_id,
        role: ParticipantRole.ADMIN,
      });
      await participantsService.new({
        group_id: group.id,
        user_id: friendRequest.received_by_id,
        role: ParticipantRole.ADMIN,
      });

      await friendsRepository.update(String(friend_id), {
        state: state === "ACCEPT" ? FriendsState.FRIENDS : FriendsState.NONE,
        chat_id: group.id,
      });
    }

    return res.json({
      state: state === "ACCEPT" ? FriendsState.FRIENDS : FriendsState.NONE,
    });
  }

  async remove(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const { friend_id } = req.params;

    const friend = await friendsRepository.findOne(friend_id);

    if (!friend) throw new AppError("Friend not found", 404);

    if (
      friend.requested_by_id !== req.userId &&
      friend.received_by_id !== req.userId
    ) {
      throw new AppError("User not authorized for this action", 403);
    }

    await friendsRepository.save({ ...friend, state: FriendsState.UNFRIENDS });

    return res.sendStatus(200);
  }
}

export { FriendsController };
