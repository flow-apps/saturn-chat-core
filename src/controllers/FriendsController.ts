import { Response } from "express";
import { getCustomRepository, In } from "typeorm";
import { FriendsState } from "../database/enums/friends";
import { GroupType } from "../database/enums/groups";
import { InviteType } from "../database/enums/invites";
import {
  ParticipantRole,
  ParticipantState,
} from "../database/enums/participants";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { FriendsRepository } from "../repositories/FriendsRepository";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { InvitesRepository } from "../repositories/InvitesRepository";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { ReadMessagesRepository } from "../repositories/ReadMessagesRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import { InvitesService } from "../services/InvitesService";
import { MessagesService } from "../services/MessagesService";
import { NotificationsService } from "../services/NotificationsService";
import { ParticipantsService } from "../services/ParticipantsService";
import _ from "lodash";
import { NotificationsType } from "../types/enums";

class FriendsController {
  async list(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const messagesRepository = getCustomRepository(MessagesRepository);
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository);

    const friends = await friendsRepository.findManyFriendsWithPremiumField({
      where: [
        { state: FriendsState.FRIENDS, requested_by_id: req.userId },
        { state: FriendsState.FRIENDS, received_by_id: req.userId },
      ],
      loadEagerRelations: true,
    });

    if (!friends) {
      return res.json([]);
    }

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

  async request(req: RequestAuthenticated, res: Response) {
    const usersRepository = getCustomRepository(UsersRepository);
    const friendsRepository = getCustomRepository(FriendsRepository);
    const notificationsService = new NotificationsService();
    const friendID = req.query.friend_id as string;
    const userID = req.userId;

    if (!friendID) throw new AppError("Friend ID not provided", 404);

    const requestedBy = await usersRepository.findUserWithPremiumField(userID);
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
          requested_by_id: userID,
          received_by_id: friendID,
          state: FriendsState.REQUESTED,
        });

        await notificationsService.send({
          name: "Friend Request Notification",
          tokens: [friendID],
          message: {
            headings: {
              pt: `👥 ${requestedBy.name} quer ser seu amigo`,
              en: `👥 ${requestedBy.name} to want be your friend`,
            },
            contents: {
              pt: "Clique aqui para aceitar ou recusar",
              en: "Click here for to accept or decline",
            },
          },
        });

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
    await notificationsService.send({
      name: "Friend Request Notification",
      tokens: [friendID],
      data: {
        type: NotificationsType.FRIEND_REQUEST,
      },
      message: {
        headings: {
          pt: `👥 ${requestedBy.name} quer ser seu amigo`,
          en: `👥 ${requestedBy.name} to want be your friend`,
        },
        contents: {
          pt: "Clique aqui para aceitar ou recusar",
          en: "Click here for to accept or decline",
        },
      },
    });

    return res.json(createdFriendRequest);
  }

  async response(req: RequestAuthenticated, res: Response) {
    const participantsService = new ParticipantsService();
    const groupsRepository = getCustomRepository(GroupsRepository);
    const friendsRepository = getCustomRepository(FriendsRepository);
    const notificationsService = new NotificationsService();
    const { state, friend_id } = req.query;

    const friendRequest = await friendsRepository.findOne(String(friend_id), {
      relations: ["requested_by", "received_by"],
    });

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
        state: FriendsState.FRIENDS,
        chat_id: group.id,
      });

      await notificationsService.send({
        name: "Friend Request Accept Notification",
        tokens: [friendRequest.requested_by_id],
        data: {
          type: NotificationsType.FRIEND_REQUEST_ACCEPT,
        },
        message: {
          headings: {
            pt: `✔ ${friendRequest.received_by.name} aceitou seu pedido de amizade!`,
            en: `✔ ${friendRequest.received_by.name} accept your friendship request!`,
          },
          contents: {
            pt: "Acesse o menu de 'Amigos' e comece a conversar",
            en: "Access the menu 'Friends' and start talk",
          },
        },
      });
    }

    return res.json({
      state: state === "ACCEPT" ? FriendsState.FRIENDS : FriendsState.NONE,
    });
  }

  async remove(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const messagesRepository = getCustomRepository(MessagesRepository);
    const messagesService = new MessagesService();
    const { friend_id } = req.params;

    const friend = await friendsRepository.findOne(friend_id);
    const allMessages = await messagesRepository.find({
      where: { group_id: friend.chat_id },
      select: ["id"],
    });

    if (!friend) throw new AppError("Friend not found", 404);

    if (
      friend.requested_by_id !== req.userId &&
      friend.received_by_id !== req.userId
    ) {
      throw new AppError("User not authorized for this action", 403);
    }

    await friendsRepository.save({ ...friend, state: FriendsState.UNFRIENDS });

    for (let message of allMessages) {
      await messagesService.delete(message.id, req.userId, friend.chat_id);
    }

    return res.sendStatus(200);
  }

  async friendsToInvite(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const invitesRepository = getCustomRepository(InvitesRepository);
    const participantsService = new ParticipantsService();
    const userID = req.userId;
    const group_id = req.query.group_id as string;

    if (!group_id) throw new AppError("Group ID not provided", 404);

    const friends = await friendsRepository.find({
      where: [
        { state: FriendsState.FRIENDS, received_by_id: userID },
        { state: FriendsState.FRIENDS, requested_by_id: userID },
      ],
    });

    const friendsNotInGroup = await Promise.all(
      friends.map(async (friend) => {
        const friendID =
          userID === friend.received_by_id
            ? friend.requested_by_id
            : friend.received_by_id;
        const isPart = await participantsService.index(friendID, group_id);

        if (!isPart || isPart.state !== ParticipantState.JOINED) {
          const hasInvite = await invitesRepository.findOne({
            where: {
              friend_id: friend.id,
              received_by_id: friendID,
              group_id: group_id,
            },
          });

          return Object.assign(friend, { invited: !!hasInvite });
        }
      })
    );

    return res.json(friendsNotInGroup.filter(Boolean));
  }

  async sendGroupInviteToFriend(req: RequestAuthenticated, res: Response) {
    const { group_id, user_id } = req.query as { [key: string]: string };
    const invitesService = new InvitesService();

    const invite = await invitesService.create({
      type: InviteType.FRIEND,
      creating_user_id: req.userId,
      invited_user_id: user_id,
      group_id,
    });

    return res.json(invite);
  }
}

export { FriendsController };
