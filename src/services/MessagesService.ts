import { getCustomRepository, In, Not } from "typeorm";
import { MessagesRepository } from "../repositories/MessagesRepository";
import * as Yup from "yup";
import { Audio } from "../entities/Audio";
import { ParticipantsService } from "./ParticipantsService";
import { ReadMessagesRepository } from "../repositories/ReadMessagesRepository";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";
import { Time } from "../utils/time";

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

interface IGetMessageWithFilesProps {
  message: string;
  message_id: string;
  author_id: string;
  group_id: string;
}

class MessagesService {

  async getNotificationsTokens(groupID: string, userID: string) {
    const participantsRepository = getCustomRepository(ParticipantsRepository)
    const userNotificationsRepository = getCustomRepository(UserNotificationsRepository)
    const time = new Time()

    const participants = await participantsRepository.find({
      where: {group_id: groupID, user_id: Not(userID)},
      select: ["user_id"]
    })

    const [ tokens ] = await Promise.all(participants.map(async participant => {
      const validTokens = await userNotificationsRepository.find({
        where: { user_id: participant.user_id },
        cache: time.timeToMS(1, "hour"),
        select: ["notification_token"]
      }).then(t => t.map(t => t.notification_token))

      return validTokens
    }))

    return tokens

  }

  async create(msgData: ICreateMessageProps) {
    const messageRepository = getCustomRepository(MessagesRepository);
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository)
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
    const newReadMessage = readMessagesRepository.create({
      message_id: savedMessage.id,
      user_id: savedMessage.author_id,
      group_id: msgData.group_id
    })

    await readMessagesRepository.save(newReadMessage)
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

  async getMessageWithFiles(msgData: IGetMessageWithFilesProps) {
    const messagesRepository = getCustomRepository(MessagesRepository);
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository)
    const participantsService = new ParticipantsService();

    const participant = await participantsService.index(
      msgData.author_id,
      msgData.group_id
    );

    if (!participant) {
      throw new Error("Error on create a message for this group!");
    }

    await messagesRepository.update(msgData.message_id, {
      message: msgData.message,
    });

    const newReadMessage = readMessagesRepository.create({
      message_id: msgData.message_id,
      user_id: msgData.author_id,
      group_id: msgData.group_id
    })

    await readMessagesRepository.save(newReadMessage)

    const completedMessage = await messagesRepository.findOne(
      msgData.message_id,
      {
        loadEagerRelations: true,
        relations: ["author", "author.avatar", "group"],
      }
    );

    return completedMessage;
  }

  async readMessage(messageID: string, userID: string, groupID: string) {
    const readMessagesRepository = getCustomRepository(ReadMessagesRepository)
    const isRead = await readMessagesRepository.findOne({
      where: { user_id: userID, message_id: messageID }
    })

    if (!isRead) {
      const newReadMessage = readMessagesRepository.create({
        message_id: messageID,
        user_id: userID,
        group_id: groupID
      })

      await readMessagesRepository.save(newReadMessage)
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
