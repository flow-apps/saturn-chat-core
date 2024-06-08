import {
  EntityRepository,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from "typeorm";
import { Friend } from "../entities/Friend";
import { SubscriptionsService } from "../services/SubscriptionsService";

@EntityRepository(Friend)
class FriendsRepository extends Repository<Friend> {
  async findManyFriendsWithPremiumField(options?: FindManyOptions<Friend>) {
    const friends = await this.find(options);
    const subscriptionsService = new SubscriptionsService();

    if (!friends.length) return undefined;

    friends.forEach(async (friend) => {
      friend.received_by.isPremium = await (async () => {
        const sub = await subscriptionsService.get(
          friend.received_by.id,
          true,
          true
        );
        const isActive = await subscriptionsService.isActive(sub);
        return isActive;
      })();

      friend.requested_by.isPremium = await (async () => {
        const sub = await subscriptionsService.get(
          friend.requested_by.id,
          true,
          true
        );
        const isActive = await subscriptionsService.isActive(sub);
        return isActive;
      })();
    });

    return friends;
  }

  async findFriendWithPremiumField(options?: FindOneOptions<Friend>) {
    const friend = await this.findOne(options);
    const subscriptionsService = new SubscriptionsService();

    if (!friend) return undefined;

    friend.received_by.isPremium = await (async () => {
      const sub = await subscriptionsService.get(
        friend.received_by.id,
        true,
        true
      );
      const isActive = await subscriptionsService.isActive(sub);
      return isActive;
    })();

    friend.requested_by.isPremium = await (async () => {
      const sub = await subscriptionsService.get(
        friend.requested_by.id,
        true,
        true
      );
      const isActive = await subscriptionsService.isActive(sub);
      return isActive;
    })();

    return friend;
  }
}

export { FriendsRepository };
