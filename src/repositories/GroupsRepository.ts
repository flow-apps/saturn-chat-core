import { EntityRepository, Repository } from "typeorm";
import { Group } from "../entities/Group";

@EntityRepository(Group)
class GroupsRepository extends Repository<Group> {}

export { GroupsRepository };
