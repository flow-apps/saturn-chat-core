import { getCustomRepository } from "typeorm";
import { MessagesRepository } from "../repositories/MessagesRepository";
import * as Yup from "yup";

interface ICreateMessageProps {
  message: string;
  group_id: string;
  author_id: string;
}

class MessagesService {
  async create(msgData: ICreateMessageProps) {
    const messageRepository = getCustomRepository(MessagesRepository);
    const schema = Yup.object().shape({
      message: Yup.string().max(500).required(),
      group_id: Yup.string().required(),
      author_id: Yup.string().required(),
    });

    try {
      await schema.validate(msgData, { abortEarly: false });
    } catch (error) {
      throw new Error(error);
    }

    const newMessage = messageRepository.create(msgData);
    const savedMessage = await messageRepository.save(newMessage);
    const message = await messageRepository.findOne(savedMessage.id, {
      relations: ["author", "author.avatar", "group"],
    });

    return message;
  }
}

export { MessagesService };
