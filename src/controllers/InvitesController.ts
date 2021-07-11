import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { InvitesRepository } from "../repositories/InvitesRepository";
import { AppError } from "../errors/AppError";

import * as Yup from "yup"
import dayjs from "dayjs"
import crypto from "crypto"

class InvitesController {
    async create(req: RequestAuthenticated, res: Response) {
        const userID = req.userId
        const body = req.body;
        const invitesRepository = getCustomRepository(InvitesRepository)
        const groupsRepository = getCustomRepository(GroupsRepository)

        const schema = Yup.object().shape({
            groupId: Yup.string().required(),
            isPermanent: Yup.boolean().required(),
            isUnlimitedUsage: Yup.boolean().required(),
            usageAmount: Yup.number().min(0).max(999),
            expireIn: Yup.number().min(1).max(30),
            expireTimezone: Yup.string().required()
        })

        try {
            await schema.validate(body, { abortEarly: false })
        } catch (error) {
            throw new AppError(error.message)
        }

        const group = await groupsRepository.findOne(body.groupId)

        if (!group || group.owner_id !== req.userId) {
            throw new AppError("Group error")
        }

        const inviteCode = crypto.randomBytes(4).toString("hex")
        const expireDate = dayjs().add(Number(body.expireIn), "day").toDate()
        const isPermanent = body.isPermanent === "true"
        const isUnlimitedUsage = body.isUnlimitedUsage === "true"
        const usageAmount = Number(body.usageAmount)

        const invite = invitesRepository.create({
            group_id: body.groupId,
            invite_code: inviteCode,
            is_permanent: isPermanent,
            is_unlimited_usage: isUnlimitedUsage,
            expire_in: !isPermanent ? expireDate : undefined,
            expire_timezone: body.expireTimezone,
            usage_amount: 0,
            max_usage_amount: !isUnlimitedUsage ? usageAmount : undefined
        })

        await invitesRepository.save(invite)
        return res.json(invite)
    }
}

export { InvitesController }
