import cron from "node-cron";
import { LessThan, Not, getCustomRepository } from "typeorm";
import { SubscriptionsRepository } from "../repositories/SubcriptionsRepository";
import { SubscriptionsService } from "../services/SubscriptionsService";

export const updateSubcriptionsTask = cron.schedule(
  "*/10 * * * *", // A CADA 10 MINUTOS
  async () => {
    console.log("[ Subscriptions Task ] Validando assinaturas expiradas");

    const subscriptionsRepository = getCustomRepository(
      SubscriptionsRepository
    );
    const subscriptionsService = new SubscriptionsService();
    const nowTime = new Date().getTime();
    const allSubscriptionsExpired = await subscriptionsRepository.find({
      where: [
        { expiry_in: LessThan(nowTime), cancel_reason: null },
        { expiry_in: LessThan(nowTime), auto_renewing: false },
        { resume_in: Not(null) },
      ],
    });

    if (allSubscriptionsExpired.length === 0) return;

    let updatedSubs = 0;

    await Promise.all(
      allSubscriptionsExpired.map((sub) => {
        subscriptionsService.get(sub.user_id, true, false);
        updatedSubs++;
      })
    );

    console.log(`[ Subscriptions Task ] ${updatedSubs} assinaturas foram atualizadas`);
  }
);
