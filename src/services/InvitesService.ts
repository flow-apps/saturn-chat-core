import { getCustomRepository } from "typeorm";
import { InviteType } from "../database/enums/invites";
import { ParticipantRole } from "../database/enums/participants";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { InvitesRepository } from "../repositories/InvitesRepository";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import crypto from "crypto";
import { FriendsRepository } from "../repositories/FriendsRepository";
import { FriendsState } from "../database/enums/friends";
import { AppError } from "../errors/AppError";

interface CreateInviteParams {
  type: InviteType;
  group_id: string;
  creating_user_id: string;
  invited_user_id?: string;
}

class InvitesService {
  async create({
    type,
    group_id,
    creating_user_id,
    invited_user_id,
  }: CreateInviteParams) {
    const invitesRepository = getCustomRepository(InvitesRepository);
    const groupsRepository = getCustomRepository(GroupsRepository);
    const participantsRepository = getCustomRepository(ParticipantsRepository);
    const friendsRepository = getCustomRepository(FriendsRepository);

    const authorizedRoles = [
      ParticipantRole.OWNER,
      ParticipantRole.ADMIN,
      ParticipantRole.MANAGER,
    ];

    const group = await groupsRepository.findOne(group_id);
    const requestedBy = await participantsRepository.findOne({
      where: { user_id: creating_user_id, group_id: group.id },
    });

    if (!group) {
      throw new AppError("Group error");
    }

    if (!authorizedRoles.includes(requestedBy.role)) {
      throw new AppError("User not authorized for this action");
    }
    if (type === InviteType.FRIEND) {
      const areFriends = await friendsRepository.findOne({
        where: [
          {
            state: FriendsState.FRIENDS,
            received_by_id: creating_user_id,
            requested_by_id: invited_user_id,
          },
          {
            state: FriendsState.FRIENDS,
            received_by_id: invited_user_id,
            requested_by_id: creating_user_id,
          },
        ],
      });

      if (!areFriends) {
        throw new AppError("Users not are friends");
      }

      const hasInvite = await invitesRepository.findOne({
        where: { friend_id: areFriends.id, received_by_id: invited_user_id },
      });

      if (hasInvite) throw new AppError("Invite already exists");

      const invite_code = crypto.randomBytes(8).toString("hex");
      const invite = invitesRepository.create({
        group_id,
        type,
        invite_code,
        sended_by_id: creating_user_id,
        received_by_id: invited_user_id,
        friend_id: areFriends.id,
        is_permanent: true,
        is_unlimited_usage: false,
        expire_in: undefined,
        expire_timezone: "America/Sao_Paulo",
        usage_amount: 0,
        max_usage_amount: 1,
      });

      await invitesRepository.save(invite);
      const completedInvite = await invitesRepository.findOne(invite.id, {
        loadEagerRelations: true,
      });

      return completedInvite;
    }
  }

  async checkHasInvites(userID: string) {
    const invitesRepository = getCustomRepository(InvitesRepository);
    const hasInvites = await invitesRepository.findOne({
      where: { received_by_id: userID },
    });

    return !!hasInvites;
  }
}

export { InvitesService };
