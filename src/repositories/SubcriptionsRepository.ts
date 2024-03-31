import { EntityRepository, Repository } from "typeorm";
import { Subscription } from "../entities/Subscription";

@EntityRepository(Subscription)
class SubscriptionsRepository extends Repository<Subscription> {}

export { SubscriptionsRepository };
