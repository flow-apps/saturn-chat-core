import { getCustomRepository, In } from "typeorm";
import { MessagesRepository } from "../repositories/MessagesRepository";
import * as Yup from "yup";
import { Audio } from "../entities/Audio";
import { ParticipantsService } from "./ParticipantsService";
import { FilesRepository } from "../repositories/FilesRepository";
import { File } from "../entities/File";

interface ICreateMessageProps {
  message: string;
  group_id: string;
  author_id: string;
}

interface ICreateAudioProps {
  audio: Audio;
  message?: string;
  group_id: string;
  author_id: string;
}

interface ICreateMessageWithFilesProps {
  files: File[];
  message: string;
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
      const participantsService = new ParticipantsService();

      const participant = await participantsService.index(
        audioData.author_id,
        audioData.group_id
      );

      if (!participant) {
        throw new Error("Error on create a message for this group!");
      }

      const data = {
        message: audioData.message ? audioData.message : "",
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

  async createWithFiles(msgData: ICreateMessageWithFilesProps) {
    const messagesRepository = getCustomRepository(MessagesRepository);
    const filesRepository = getCustomRepository(FilesRepository);
    const participantsService = new ParticipantsService();

    const participant = await participantsService.index(
      msgData.author_id,
      msgData.group_id
    );

    if (!participant) {
      throw new Error("Error on create a message for this group!");
    }

    const data = {
      message: msgData.message,
      author_id: msgData.author_id,
      group_id: msgData.group_id,
    };

    const newMessage = messagesRepository.create(data);
    await messagesRepository.save(newMessage);
    const filesIds = msgData.files.map((file) => file.id);

    await filesRepository.update(filesIds, {
      message_id: newMessage.id,
    });

    const completedMessage = await messagesRepository.findOne(newMessage.id, {
      loadEagerRelations: true,
      relations: ["author", "author.avatar", "group"],
    });

    return completedMessage;
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
