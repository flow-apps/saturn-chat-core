import { EntityRepository, Repository } from "typeorm";
import { Friend } from "../entities/Friend";

@EntityRepository(Friend)
class FriendsRepository extends Repository<Friend> {}

export { FriendsRepository };
