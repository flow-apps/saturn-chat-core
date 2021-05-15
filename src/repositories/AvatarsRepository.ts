import { EntityRepository, Repository } from "typeorm";
import { Avatar } from "../entities/Avatar";

@EntityRepository(Avatar)
class AvatarsRepository extends Repository<Avatar> {}

export { AvatarsRepository };
