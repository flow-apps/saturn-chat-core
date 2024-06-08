import { EntityRepository, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { Group } from "../entities/Group";
import { SubscriptionsService } from "../services/SubscriptionsService";

@EntityRepository(Group)
class GroupsRepository extends Repository<Group> {
  async findGroupOwnerWithPremiumField(options?: FindOneOptions<Group>) {
    const group = await this.findOne(options);
    const subscriptionsService = new SubscriptionsService();

    if (!group) return undefined;

    group.owner.isPremium = await (async () => {
      const sub = await subscriptionsService.get(group.owner.id, true, true);
      const isActive = await subscriptionsService.isActive(sub);
      return isActive;
    })();

    return group;
  }

  async findManyGroupsOwnersWithPremiumField(options?: FindManyOptions<Group>) {
    const groups = await this.find(options);
    const subscriptionsService = new SubscriptionsService();

    if (!groups.length) return undefined;

    groups.forEach(async (group) => {
      group.owner.isPremium = await (async () => {
        const sub = await subscriptionsService.get(group.owner.id, true, true);
        const isActive = await subscriptionsService.isActive(sub);
        return isActive;
      })();
    })

    return groups;
  }
}

export { GroupsRepository };
