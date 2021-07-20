import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { getCustomRepository, In } from "typeorm";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";
import { Time } from "../utils/time";

type SendNotificationProps = {
  tokens: string[];
  message: NotificationsBody;
  data?: object;
  priority?: "default" | "normal" | "high";
  channelId?: string;
  categoryId?: string;
};

type NotificationsBody = {
  content: {
    title: string;
    body: string;
  };
};

type GetNotificationsProps = {
  usersID: string[];
};

class NotificationsService {
  private ExpoClient: Expo;

  constructor() {
    this.ExpoClient = new Expo({
      accessToken: process.env.EXPO_NOTIFICATIONS_TOKEN,
    });
  }

  async getNotificationsTokens({ usersID }: GetNotificationsProps) {
    const userNotificationsRepository = getCustomRepository(
      UserNotificationsRepository
    );
    const time = new Time();

    const tokens = await userNotificationsRepository
      .find({
        where: { user_id: In(usersID), is_revoked: false },
        cache: time.timeToMS(1, "hour"),
        select: ["notification_token"],
      })
      .then((tokens) => tokens.map((t) => t.notification_token));

    return tokens;
  }

  async send(data: SendNotificationProps) {
    const notificationTokens = data.tokens;
    const preparedMessages = [];

    notificationTokens.map((token) => {
      if (!Expo.isExpoPushToken(token)) return;

      preparedMessages.push({
        to: token,
        ttl: 604800,
        title: data.message.content.title,
        body: data.message.content.body,
        data: data.data || {},
        priority: data.priority || "default",
        channelId: data.channelId || "default",
        categoryId: data.categoryId || undefined,
      });
    });

    const notificationsChunks =
      this.ExpoClient.chunkPushNotifications(preparedMessages);
    const notificationsTickets: ExpoPushTicket[] = [];

    await Promise.all(
      notificationsChunks.map(async (chunk) => {
        try {
          const ticketChunk = await this.ExpoClient.sendPushNotificationsAsync(
            chunk
          );
          notificationsTickets.push(...ticketChunk);
        } catch (error) {
          console.log(error);
        }
      })
    );

    notificationsTickets.map((ticket) => {
      if (ticket.status === "ok") return;

      console.log(ticket);
    });
  }
}

export { NotificationsService };
