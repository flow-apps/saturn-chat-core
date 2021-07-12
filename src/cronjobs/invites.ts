import cron from "node-cron"
import { getCustomRepository, MoreThanOrEqual } from "typeorm"
import { InvitesRepository } from "../repositories/InvitesRepository"

const removeExpiredInvitesTask = cron.schedule("1 * * * *", async () => {
  const invitesRepository = getCustomRepository(InvitesRepository)
  await invitesRepository.delete({
    expire_in: MoreThanOrEqual(new Date()),
  })
})

export { removeExpiredInvitesTask }