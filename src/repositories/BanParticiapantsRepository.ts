import { EntityRepository, Repository } from "typeorm";
import { BanParticipant } from "../entities/BanParticipant";

@EntityRepository(BanParticipant)
class BanParticipantsRepository extends Repository<BanParticipant> {}

export { BanParticipantsRepository };
