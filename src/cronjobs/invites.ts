import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import cron from "node-cron"
import { getCustomRepository } from "typeorm"
import { InvitesRepository } from "../repositories/InvitesRepository"

dayjs.extend(utc);
dayjs.extend(timezone);

const removeExpiredInvitesTask = cron.schedule("1 * * * * *", async () => {
  console.log(">> Cleaning all expired invites <<");
  
  let deletedAmount = 0
  const invitesRepository = getCustomRepository(InvitesRepository)
  const allInvites = await invitesRepository.find({
    where: [
      { is_permanent: false },
      { is_unlimited_usage: false },
    ],
    take: 1000,
    cache: 1900000,
    order: { expire_in: 'DESC' }
  })

  Promise.all(allInvites.map(async invite => {
    if (!invite.expire_in || !invite.expire_timezone) return false;

    const date = new Date();
    const expireDate = dayjs.tz(invite.expire_in, invite.expire_timezone);
    const expired = dayjs.tz(date, invite.expire_timezone).isAfter(expireDate);
    const reachedLimitUsage = invite.usage_amount >= invite.max_usage_amount

    if (expired || (reachedLimitUsage && !invite.is_unlimited_usage) ) {
      deletedAmount += 1
      return await invitesRepository.delete(invite.id)
    }
  }))

  console.log(`>> ${deletedAmount} invites expired removed <<`);
  
})

export { removeExpiredInvitesTask }