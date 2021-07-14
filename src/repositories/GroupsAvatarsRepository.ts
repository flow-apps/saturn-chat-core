import { EntityRepository, Repository } from "typeorm";
import { GroupAvatar } from "../entities/GroupAvatar";

@EntityRepository(GroupAvatar)
class GroupsAvatarsRepository extends Repository<GroupAvatar> {}

export { GroupsAvatarsRepository };
