import { EntityRepository, Repository } from "typeorm";
import { Participant } from "../entities/Participant";

@EntityRepository(Participant)
class ParticipantsRepository extends Repository<Participant> {}

export { ParticipantsRepository };
