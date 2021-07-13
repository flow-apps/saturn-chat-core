import { Response } from "express";
import { getCustomRepository } from "typeorm";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { InvitesRepository } from "../repositories/InvitesRepository";
import { AppError } from "../errors/AppError";

import * as Yup from "yup";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import crypto from "crypto";
import { ParticipantsService } from "../services/ParticipantsService";
import { Invite } from "../entities/Invite";

dayjs.extend(utc);
dayjs.extend(timezone);

async function isValidInvite(invite: Invite) {
  const invitesRepository = getCustomRepository(InvitesRepository);

  if (!invite.is_permanent) {
    if (!invite.expire_in || !invite.expire_timezone) return false;

    const date = new Date();
    const expireDate = dayjs.tz(invite.expire_in, invite.expire_timezone);
    const expired = dayjs.tz(date, invite.expire_timezone).isAfter(expireDate);

    if (expired) {
      await invitesRepository.delete(invite.id);
      return false;
    }
  }

  if (!invite.is_unlimited_usage) {
    const reachedInLimit = invite.max_usage_amount === invite.usage_amount;
    if (reachedInLimit) {
      await invitesRepository.delete(invite.id);
      return false;
    }
  }
  return true;
}

class InvitesController {
  async create(req: RequestAuthenticated, res: Response) {
    const userID = req.userId;
    const body = req.body;
    const invitesRepository = getCustomRepository(InvitesRepository);
    const groupsRepository = getCustomRepository(GroupsRepository);

    const schema = Yup.object().shape({
      groupId: Yup.string().required(),
      isPermanent: Yup.boolean().required(),
      isUnlimitedUsage: Yup.boolean().required(),
      usageAmount: Yup.number().min(0).max(999),
      expireIn: Yup.number().min(1).max(30),
      expireTimezone: Yup.string().required(),
    });

    try {
      await schema.validate(body, { abortEarly: false });
    } catch (error) {
      throw new AppError(error.message);
    }

    const group = await groupsRepository.findOne(body.groupId);

    if (!group || group.owner_id !== userID) {
      throw new AppError("Group error");
    }

    const inviteCode = crypto.randomBytes(4).toString("hex");
    const expireDate = dayjs().add(Number(body.expireIn), "days").toDate();
    const isPermanent = body.isPermanent === "true";
    const isUnlimitedUsage = body.isUnlimitedUsage === "true";
    const usageAmount = Number(body.usageAmount);

    const invite = invitesRepository.create({
      group_id: body.groupId,
      invite_code: inviteCode,
      is_permanent: isPermanent,
      is_unlimited_usage: isUnlimitedUsage,
      expire_in: !isPermanent ? expireDate : undefined,
      expire_timezone: body.expireTimezone,
      usage_amount: 0,
      max_usage_amount: !isUnlimitedUsage ? usageAmount : undefined,
    });

    await invitesRepository.save(invite);
    return res.json(invite);
  }

  async list(req: RequestAuthenticated, res: Response) {
    const { groupID } = req.params;
    const userID = req.userId;
    const invitesRepository = getCustomRepository(InvitesRepository);

    const invites = await invitesRepository.find({
      where: [{ group_id: groupID }],
      relations: ["group"],
      cache: 10000,
    });

    return res.json(invites);
  }

  async get(req: RequestAuthenticated, res: Response) {
    const { inviteID } = req.params;
    const invitesRepository = getCustomRepository(InvitesRepository);
    const invite = await invitesRepository.findOne(inviteID, {
      relations: ["group"],
    });

    if (!invite) throw new AppError("Invite not found", 404);

    const isValid = await isValidInvite(invite);

    if (!isValid) throw new AppError("Invite invalid");

    return res.json(invite);
  }

  async join(req: RequestAuthenticated, res: Response) {
    const { inviteID } = req.params;
    const userID = req.userId;
    const invitesRepository = getCustomRepository(InvitesRepository);
    const participantsService = new ParticipantsService();
    const invite = await invitesRepository.findOne(inviteID);

    if (!invite) throw new AppError("Invite invalid");

    const isValid = await isValidInvite(invite);

    if (!isValid) throw new AppError("Invite invalid");

    const participant = await participantsService.new({
      group_id: invite.group_id,
      user_id: userID,
    });

    if (participant) {
      const usageAmount = invite.usage_amount + 1;

      if (usageAmount === invite.max_usage_amount)
        await invitesRepository.delete(invite.id);
      else
        await invitesRepository.update(invite.id, {
          usage_amount: usageAmount,
        });

      return res.json(participant);
    } else {
      throw new AppError("Invite error");
    }
  }

  async delete(req: RequestAuthenticated, res: Response) {
    const { inviteID } = req.params;
    const userID = req.userId;

    const invitesRepository = getCustomRepository(InvitesRepository);
    const invite = await invitesRepository.findOne(inviteID, {
      relations: ["group"],
      order: { expire_in: "ASC" },
    });

    if (!invite || invite.group.owner_id !== userID) {
      throw new AppError("Invite delete error");
    }

    await invitesRepository.delete(invite.id);
    return res.sendStatus(204);
  }
}

export { InvitesController };
