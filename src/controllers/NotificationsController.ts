import { Response } from "express";
import { RequestAuthenticated } from "../middlewares/authProvider";

import * as Yup from "yup"
import { AppError } from "../errors/AppError";
import { Expo } from "expo-server-sdk"
import { getCustomRepository } from "typeorm";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";

type RegisterNotificationBody = {
  notificationToken: string
  platform: string
}

class NotificationsController {

  async register(req: RequestAuthenticated, res: Response) {
    const userNotificationsRepository = getCustomRepository(UserNotificationsRepository)
    const schema = Yup.object().shape({
      notificationToken: Yup.string().required(),
      platform: Yup.string().required()
    })

    let validatedBody: RegisterNotificationBody

    try {
      validatedBody = await schema.validate(req.body, { stripUnknown: true, abortEarly: false })
    } catch (error) {
      throw new AppError(error.errors)
    }

    if (!Expo.isExpoPushToken(validatedBody.notificationToken)) {
      throw new AppError("Invalid Expo Push Token")
    }

    const userNotificationsExists = await userNotificationsRepository.findOne({
      where: [{ notification_token: validatedBody.notificationToken }]
    })

    if (!userNotificationsExists) {
      const newUserNotificationRepository = userNotificationsRepository.create({
        notification_token: validatedBody.notificationToken,
        platform: validatedBody.platform,
        user_id: req.userId
      })
    
      await userNotificationsRepository.save(newUserNotificationRepository)
      return res.sendStatus(201)
    }

    const merged = userNotificationsRepository.merge(userNotificationsExists, {
      notification_token: validatedBody.notificationToken
    })
    await userNotificationsRepository.save(merged)
    return res.json(merged)
  }

  async unregister(req: RequestAuthenticated, res: Response) {
    const userNotificationsRepository = getCustomRepository(UserNotificationsRepository)
    const { token } = req.params

    if (!token || !Expo.isExpoPushToken(token)) {
      throw new AppError("Invalid Expo Push Token")
    }

    const userNotificationsExists = await userNotificationsRepository.findOne({
      where: [{ user_id: req.userId }, { notification_token: token }]
    })

    if (userNotificationsExists) {
      await userNotificationsRepository.delete(userNotificationsExists)
      return res.sendStatus(201)
    } else {
      throw new AppError("User Token not found")
    }
  }

  async toggle(req: RequestAuthenticated, res: Response) {
    const { token } = req.params
    const enable = req.query.enabled as "yes" | "no"
    const userNotificationsRepository = getCustomRepository(UserNotificationsRepository)    

    if (!token || !Expo.isExpoPushToken(token)) {
      throw new AppError("Notification token not provided")
    }

    const userNotification = await userNotificationsRepository.findOne({
      where: { notification_token: token },
    })    

    if (!userNotification) {
      throw new AppError("Notification token not found", 404)
    }

    await userNotificationsRepository.update(userNotification.id, {
      send_notification: enable === "yes"
    })

    return res.sendStatus(204)
  }

}

export { NotificationsController }