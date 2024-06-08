import {
  EntityRepository,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from "typeorm";
import { Participant } from "../entities/Participant";
import { SubscriptionsService } from "../services/SubscriptionsService";

@EntityRepository(Participant)
class ParticipantsRepository extends Repository<Participant> {
  async findParticipantWithPremiumField(options: FindOneOptions<Participant>) {
    const participant = await this.findOne(options);
    const subscriptionsService = new SubscriptionsService();

    if (!participant) return undefined;

    participant.user.isPremium = await (async () => {
      const sub = await subscriptionsService.get(
        participant.user.id,
        true,
        true
      );
      const isActive = await subscriptionsService.isActive(sub);
      return isActive;
    })();

    return participant;
  }

  async findParticipantsWithPremiumField(
    options?: FindManyOptions<Participant>
  ) {
    const participants = await this.find(options);
    const subscriptionsService = new SubscriptionsService();

    if (!participants.length) return undefined;

    participants.forEach(async (participant) => {
      participant.user.isPremium = await (async () => {
        const sub = await subscriptionsService.get(
          participant.user.id,
          true,
          true
        );
        const isActive = await subscriptionsService.isActive(sub);
        return isActive;
      })();
    });

    return participants;
  }
}

export { ParticipantsRepository };
