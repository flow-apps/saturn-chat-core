import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { FriendsState } from "../database/enums/friends";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { FriendsRepository } from "../repositories/FriendsRepository";

class FriendsController {
  async request(req: RequestAuthenticated, res: Response) {
    const friendsRepository = getCustomRepository(FriendsRepository);
    const friendID = req.query.friend_id as string;
    const userID = req.userId;

    if (!friendID) 
      throw new AppError("Friend ID not provided", 404);

    const existsRequest = await friendsRepository.findOne({
      where: [
        { requested_by_id: userID, received_by_id: friendID },
        { requested_by_id: friendID, received_by_id: userID },
      ],
    });

    if (existsRequest) 
      throw new AppError("Friend request already exists");

    const createdFriendRequest = friendsRepository.create({
      requested_by_id: userID,
      received_by_id: friendID,
      state: FriendsState.REQUESTED,
    });

    await friendsRepository.save(createdFriendRequest)

    return res.json(createdFriendRequest)
  }
}

export { FriendsController };
