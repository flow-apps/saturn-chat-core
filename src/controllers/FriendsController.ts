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

  async request(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const friendID = req.query.friend_id as string;
    const userID = req.userId;

    if (!friendID) throw new AppError("Friend ID not provided", 404);

    const existsRequest = await friendsRepository.findOne({
      where: [
        {
          requested_by_id: userID,
          received_by_id: friendID,
          state: In([FriendsState.REQUESTED, FriendsState.FRIENDS]),
        },
        {
          requested_by_id: friendID,
          received_by_id: userID,
          state: In([FriendsState.REQUESTED, FriendsState.FRIENDS]),
        },
      ],
    });

    if (existsRequest) throw new AppError("Friend request already exists");

    const createdFriendRequest = friendsRepository.create({
      requested_by_id: userID,
      received_by_id: friendID,
      state: FriendsState.REQUESTED,
    });

    await friendsRepository.save(createdFriendRequest);

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
}

export { FriendsController };
