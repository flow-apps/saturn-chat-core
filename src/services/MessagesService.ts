import { getCustomRepository } from "typeorm";
import { MessagesRepository } from "../repositories/MessagesRepository";
import * as Yup from "yup";
import { Audio } from "../entities/Audio";
import { AudiosRepository } from "../repositories/AudiosRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { ParticipantsService } from "./ParticipantsService";

interface ICreateMessageProps {
  message: string;
  group_id: string;
  author_id: string;
}

interface ICreateAudioProps {
  audio: Audio;
  group_id: string;
  author_id: string;
}

class MessagesService {
  async create(msgData: ICreateMessageProps) {
    const messageRepository = getCustomRepository(MessagesRepository);
    const participantsService = new ParticipantsService();

    const participant = await participantsService.index(
      msgData.author_id,
      msgData.group_id
    );

    if (!participant) {
      throw new Error("Error on create a message for this group!");
    }

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
      where: { group_id: savedMessage.group_id },
      relations: ["author", "author.avatar", "group"],
    });

    return message;
  }

  async createAudio(audioData: ICreateAudioProps) {
    try {
      const messagesRepository = getCustomRepository(MessagesRepository);
      const data = {
        message: "",
        author_id: audioData.author_id,
        group_id: audioData.group_id,
        voice_message_id: audioData.audio.id,
      };

      const newMessage = messagesRepository.create(data);
      await messagesRepository.save(newMessage);
      const completedMessage = await messagesRepository.findOne(newMessage.id, {
        loadEagerRelations: true,
        relations: ["author", "author.avatar", "group"],
      });

      return completedMessage;
    } catch (error) {
      new Error(error);
    }
  }

  async delete(messageID: string, userID: string) {
    const messageRepository = getCustomRepository(MessagesRepository);
    const message = await messageRepository.findOne(messageID);

    if (userID !== message.author_id) {
      throw new Error("Error on delete this message");
    }

    try {
      return await messageRepository.delete(message.id);
    } catch (error) {
      throw new Error(error);
    }
  }
}

export { MessagesService };
