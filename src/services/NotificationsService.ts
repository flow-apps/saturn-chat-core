import { Expo, ExpoPushReceipt, ExpoPushTicket } from "expo-server-sdk"

type SendNotificationProps = {
  tokens: string[],
  message: NotificationsBody,
  data?: object
  priority?: "default" | "normal" | "high"
  channelId?: string
}

type NotificationsBody = {
  content: {
    title: string
    body: string
  }
}

class NotificationsService {

  private ExpoClient: Expo

  constructor() {
    this.ExpoClient = new Expo({ accessToken: process.env.EXPO_NOTIFICATIONS_TOKEN })
  }

  async send(data: SendNotificationProps) {
    const notificationTokens = data.tokens
    const preparedMessages = []

    notificationTokens.map(token => {
      if (!Expo.isExpoPushToken(token)) return

      preparedMessages.push({
        to: token,
        title: data.message.content.title,
        body: data.message.content.body,
        data: data.data || {},
        priority: data.priority || "default",
        channelId: data.channelId || "default"
      })
    })

    const notificationsChunks = this.ExpoClient.chunkPushNotifications(preparedMessages)
    const notificationsTickets: ExpoPushTicket[] = []
    const notificationsReceipts: ExpoPushReceipt[] = []

    await Promise.all(notificationsChunks.map(async chunk => {
      try {
        const ticketChunk = await this.ExpoClient.sendPushNotificationsAsync(chunk)
        notificationsTickets.push(...ticketChunk)
      } catch (error) {
        console.log(error);
      }
    }))

    notificationsTickets.map(ticket => {
      if (ticket.status === "ok") return
      
      if (ticket.details.error === "DeviceNotRegistered") {
        console.log(ticket);  
      }
    })
  }

}

export { NotificationsService }
