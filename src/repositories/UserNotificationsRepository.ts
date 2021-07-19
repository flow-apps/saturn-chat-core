import { EntityRepository, Repository } from "typeorm";
import { UserNotification } from "../entities/UserNotification";

@EntityRepository(UserNotification)
class UserNotificationsRepository extends Repository<UserNotification> {}

export { UserNotificationsRepository };
