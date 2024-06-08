import { EntityRepository, FindManyOptions, Repository } from "typeorm";
import { User } from "../entities/User";
import { SubscriptionsService } from "../services/SubscriptionsService";

@EntityRepository(User)
class UsersRepository extends Repository<User> {
  async findUserWithPremiumField(id: string, options?: FindManyOptions<User>) {
    const user = await this.findOne(id, options);
    const subscriptionsService = new SubscriptionsService();

    if (!user) return undefined;

    user.isPremium = await (async () => {
      const sub = await subscriptionsService.get(user.id, true, true);
      const isActive = await subscriptionsService.isActive(sub);
      return isActive;
    })();

    return user;
  }

  async findManyUsersWithPremiumField(options?: FindManyOptions<User>) {
    const users = await this.find(options);
    const subscriptionsService = new SubscriptionsService();

    if (!users.length) return undefined;

    users.forEach(async (user) => {
      user.isPremium = await (async () => {
        const sub = await subscriptionsService.get(user.id, true, true);
        const isActive = await subscriptionsService.isActive(sub);
        return isActive;
      })();
    });

    return users;
  }
}

export { UsersRepository };
