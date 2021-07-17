import { EntityRepository, Repository } from "typeorm";
import { ReadMessage } from "../entities/ReadMessage";

@EntityRepository(ReadMessage)
class ReadMessagesRepository extends Repository<ReadMessage> {}

export { ReadMessagesRepository };
