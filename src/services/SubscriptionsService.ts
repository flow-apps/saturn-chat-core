import { getCustomRepository } from "typeorm";
import { SubscriptionsRepository } from "../repositories/SubcriptionsRepository";
import { Subscription } from "../entities/Subscription";
import { PaymentState } from "../database/enums/subscriptions";
import dayjs from "dayjs";
import { CacheService } from "./CacheService";
import { subcriptionsAPI } from "../configs/playStoreService";

class SubscriptionsService {
  async isActive(subscription: Subscription) {
    if (!subscription) return false;

    if (subscription.payment_state === PaymentState.PENDENT) {
      return false;
    }

    if (subscription.cancel_reason) {
      return false;
    }

    if (subscription.resume_in) {
      return false;
    }

    const nowMs = new Date().getTime();

    const notIsExpire =
      dayjs(subscription.started_at).valueOf() <= nowMs &&
      dayjs(subscription.expiry_in).valueOf() >= nowMs;

    if (!notIsExpire) {
      return false;
    }

    return true;
  }

  async get(
    userId: string,
    getFromPlayStore?: boolean,
    getFromCache?: boolean
  ) {
    const cacheService = new CacheService();
    const subscriptionsRepository = getCustomRepository(
      SubscriptionsRepository
    );

    const subscription = await subscriptionsRepository.findOne({
      where: { user_id: userId },
    });

    if (!subscription) return undefined;

    if (getFromPlayStore) {
      if (getFromCache) {
        const cachedSubscription = await cacheService.get(
          `${userId}_subscription`
        );

        if (cachedSubscription) {
          console.log("[ Get Subscriptions ] Usando valor do cache");
          
          return JSON.parse(cachedSubscription) as Subscription;
        }
      }

      const subscriptionPlayStore = await subcriptionsAPI
        .get({
          packageName: subscription.package_name,
          subscriptionId: subscription.subscription_id,
          token: subscription.purchase_token,
        })
        .then((res) => {
          if (res.status === 200) return res.data;
        });

      const mergedSubscription = subscriptionsRepository.merge(subscription, {
        auto_renewing: subscriptionPlayStore.autoRenewing,
        cancel_reason: subscriptionPlayStore.cancelReason
          ? subscriptionPlayStore.cancelReason
          : null,
        expiry_in: Number(subscriptionPlayStore.expiryTimeMillis),
        started_at: Number(subscriptionPlayStore.startTimeMillis),
        payment_state: subscriptionPlayStore.paymentState,
        resume_in: subscriptionPlayStore.autoResumeTimeMillis
          ? Number(subscriptionPlayStore.autoResumeTimeMillis)
          : null,
        purchase_type: subscriptionPlayStore.purchaseType,
      });

      await subscriptionsRepository.save(mergedSubscription);

      const hasCache = await cacheService.verifyExistKey(
        `${userId}_subscription`
      );

      if (hasCache) {
        await cacheService.delete(`${userId}_subscription`);
      }

      await cacheService.setWithExpiration(
        `${userId}_subscription`,
        mergedSubscription,
        process.env.NODE_ENV === "development" ? 60 : 1800
      );

      return mergedSubscription;
    } else {
      return subscription;
    }
  }
}

export { SubscriptionsService };
