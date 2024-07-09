import { Response } from "express";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { subcriptionsAPI } from "../configs/playStoreService";
import { getCustomRepository } from "typeorm";
import { SubscriptionsRepository } from "../repositories/SubcriptionsRepository";
import { AppError } from "../errors/AppError";

import * as Yup from "yup";
import { RequestPremium } from "../middlewares/validatePremium";
import { SubscriptionsService } from "../services/SubscriptionsService";
import { SubscriptionPeriod } from "../database/enums/subscriptions";

class SubscriptionsController {
  async get(req: RequestAuthenticated, res: Response) {
    const subscriptionsService = new SubscriptionsService();

    const subscription = await subscriptionsService.get(req.userId, true);

    if (!subscription) return res.json({ hasSubscription: false });

    const isActive = await subscriptionsService.isActive(subscription);

    return res.json({
      ...subscription,
      hasSubscription: true,
      isPaused: !!subscription.resume_in,
      isActive,
    });
  }

  async register(req: RequestAuthenticated, res: Response) {
    const { purchase_token, product_id, package_name, period } = req.body;
    const subscriptionsRepository = getCustomRepository(
      SubscriptionsRepository
    );

    const schema = Yup.object().shape({
      purchase_token: Yup.string().required(),
      product_id: Yup.string().required(),
      package_name: Yup.string().required(),
      period: Yup.string().required(),
    });

    try {
      await schema.validate(req.body, { abortEarly: false });
    } catch (error) {
      throw new AppError("Data not provided", 400);
    }

    const isAcknowledge = await subcriptionsAPI
      .acknowledge({
        packageName: package_name,
        subscriptionId: product_id,
        token: purchase_token,
      })
      .then((res) => {
        return res.status === 204;
      });

    if (!isAcknowledge) {
      throw new AppError("Subscription is not acknowledge", 400);
    }

    try {
      const subscription = await subcriptionsAPI
        .get({
          packageName: package_name,
          subscriptionId: product_id,
          token: purchase_token,
        })
        .then((res) => {
          if (res.status === 200) return res.data;
        });

      const hasSubscription = await subscriptionsRepository.findOne({
        where: { user_id: req.userId },
      });

      if (hasSubscription) {
        const mergedSubscription = subscriptionsRepository.merge(
          hasSubscription,
          {
            user_id: req.userId,
            package_name,
            subscription_id: product_id,
            auto_renewing: subscription.autoRenewing,
            subscription_period:
              SubscriptionPeriod[String(period).toUpperCase()],
            cancel_reason: subscription.cancelReason
              ? subscription.cancelReason
              : null,
            purchase_token,
            expiry_in: Number(subscription.expiryTimeMillis),
            started_at: Number(subscription.startTimeMillis),
            payment_state: subscription.paymentState,
            resume_in: subscription.autoResumeTimeMillis
              ? Number(subscription.autoResumeTimeMillis)
              : null,
            purchase_type: subscription.purchaseType,
          }
        );

        await subscriptionsRepository.save(mergedSubscription);

        return res.json(mergedSubscription);
      }

      const newSubscription = subscriptionsRepository.create({
        user_id: req.userId,
        package_name,
        subscription_id: product_id,
        auto_renewing: subscription.autoRenewing,
        subscription_period: SubscriptionPeriod[String(period).toUpperCase()],
        cancel_reason: subscription.cancelReason
          ? subscription.cancelReason
          : null,
        purchase_token,
        expiry_in: Number(subscription.expiryTimeMillis),
        started_at: Number(subscription.startTimeMillis),
        payment_state: subscription.paymentState,
        resume_in: subscription.autoResumeTimeMillis
          ? Number(subscription.autoResumeTimeMillis)
          : null,
        purchase_type: subscription.purchaseType,
      });

      await subscriptionsRepository.save(newSubscription);

      return res.json(newSubscription);
    } catch (error) {
      console.log(error);

      throw new AppError(error.message, 500);
    }
  }

  async isActive(req: RequestPremium, res: Response) {
    return res.json({ isActive: req.isPremium });
  }
}

export { SubscriptionsController };
