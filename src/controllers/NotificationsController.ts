import { Response } from "express";
import { RequestAuthenticated } from "../middlewares/authProvider";

import * as Yup from "yup";
import { AppError } from "../errors/AppError";
import { getCustomRepository } from "typeorm";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";

type RegisterNotificationBody = {
  language: string;
  platform: string;
};

class NotificationsController {
  async register(req: RequestAuthenticated, res: Response) {
    const userNotificationsRepository = getCustomRepository(
      UserNotificationsRepository
    );
    const schema = Yup.object().shape({
      platform: Yup.string().required(),
      language: Yup.string(),
    });

    const body = req.body as RegisterNotificationBody;

    try {
      await schema.validate(body, {
        abortEarly: false,
      });
    } catch (error) {
      throw new AppError(error.errors);
    }

    const userNotificationsExists = await userNotificationsRepository.findOne({
      where: { user_id: req.userId },
    });

    if (!userNotificationsExists) {
      const newUserNotification = userNotificationsRepository.create({
        user_id: req.userId,
        platform: body.platform,
        language: body.language,
        send_notification: true,
        is_revoked: false
      });

      await userNotificationsRepository.save(newUserNotification);
      return res.json(newUserNotification);
    }

    const merged = userNotificationsRepository.merge(userNotificationsExists, {
      platform: body.platform,
      language: body.language,
      is_revoked: false,
    });

    await userNotificationsRepository.save(merged);
    return res.json(merged);
  }

  async unregister(req: RequestAuthenticated, res: Response) {
    const userNotificationsRepository = getCustomRepository(
      UserNotificationsRepository
    );

    const userNotificationsExists = await userNotificationsRepository.findOne({
      where: { user_id: req.userId, platform: String(req.query.platform) },
    });

    if (userNotificationsExists) {
      await userNotificationsRepository.update(userNotificationsExists, {
        is_revoked: true,
      });
      return res.sendStatus(201);
    } else {
      throw new AppError("User not found");
    }
  }

  async toggle(req: RequestAuthenticated, res: Response) {
    const enable = req.query.enabled as "0" | "1";
    const userNotificationsRepository = getCustomRepository(
      UserNotificationsRepository
    );

    const userNotification = await userNotificationsRepository.findOne({
      where: { user_id: req.userId },
    });

    if (!userNotification) {
      throw new AppError("Notification token not found", 404);
    }    

    await userNotificationsRepository.update(userNotification.id, {
      send_notification: enable === "1",
      is_revoked: false,
    });

    return res.sendStatus(204);
  }
}

export { NotificationsController };
