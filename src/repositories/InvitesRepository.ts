import { EntityRepository, Repository } from "typeorm";
import { Invite } from "../entities/Invite";

@EntityRepository(Invite)
class InvitesRepository extends Repository<Invite> {}

export { InvitesRepository };
