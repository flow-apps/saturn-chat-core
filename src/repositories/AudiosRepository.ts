import { EntityRepository, Repository } from "typeorm";
import { Audio } from "../entities/Audio";

@EntityRepository(Audio)
class AudiosRepository extends Repository<Audio> {}

export { AudiosRepository };
