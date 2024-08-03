import { getCustomRepository, ILike, Not, Raw } from "typeorm";
import { AppError } from "../errors/AppError";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { GroupsRepository } from "../repositories/GroupsRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import { GroupType } from "../database/enums/groups";
import { ParticipantsRepository } from "../repositories/ParticipantsRepository";
import { remoteConfigs } from "../configs/remoteConfigs";
import { ParticipantState } from "../database/enums/participants";
import { Response } from "express";
import { User } from "../entities/User";
import { Group } from "../entities/Group";
import _ from "lodash";

type TFilterTypes = "all" | "users" | "groups";

interface ITypedUsers extends User {
  search_type: "user";
}

interface ITypedGroup extends Group {
  search_type: "group";
}

const MAX_PARTICIPANTS_PER_GROUP_PREMIUM = Number(
  remoteConfigs.premium_max_participants
);
const MAX_PARTICIPANTS_PER_GROUP_DEFAULT = Number(
  remoteConfigs.default_max_participants
);

async function getGroups(term: string, _limit: number, _page: number) {
  const groupsRepository = getCustomRepository(GroupsRepository);
  const participantsRepository = getCustomRepository(ParticipantsRepository);

  const groups = await groupsRepository.findManyGroupsOwnersWithPremiumField({
    where: [
      {
        name: ILike(`%${term}%`),
        privacy: Not("PRIVATE"),
        type: Not(GroupType.DIRECT),
      },
      {
        tags: Raw((alias) => `${alias} @> :tags`, {
          tags: [term],
        }),
        privacy: Not("PRIVATE"),
        type: Not(GroupType.DIRECT),
      },
    ],
    skip: _page * _limit,
    take: _limit,

    cache: 10000,
  });

  if (!groups) {
    return []
  }

  const groupsWithParticipantsAmount = await Promise.all(
    groups.map(async (group: ITypedGroup) => {
      const participantsAmount = await participantsRepository.count({
        where: { group_id: group.id, state: ParticipantState.JOINED },
      });

      let acceptingParticipants = true;

      if (group.owner.isPremium) {
        if (participantsAmount >= MAX_PARTICIPANTS_PER_GROUP_PREMIUM) {
          acceptingParticipants = false;
        }
      } else {
        if (participantsAmount >= MAX_PARTICIPANTS_PER_GROUP_DEFAULT) {
          acceptingParticipants = false;
        }
      }

      return Object.assign(group, {
        participantsAmount,
        acceptingParticipants,
        search_type: "group",
      });
    })
  );

  return groupsWithParticipantsAmount;
}

async function getUsers(term: string, _limit: number, _page: number) {
  const usersRepository = getCustomRepository(UsersRepository);

  term = term.startsWith("@") ? term.replace("@", "") : term;

  let users = await usersRepository.findManyUsersWithPremiumField({
    where: [{ name: ILike(`%${term}%`) }, { nickname: ILike(`%${term}%`) }],
    skip: _page * _limit,
    take: _limit,
    cache: 10000,
  });
  
  if (!users)
    return []

  const typedUsers: ITypedUsers[] = users.map((user: ITypedUsers) => {
    user.search_type = "user";
    return user;
  });

  return typedUsers;
}

class AppController {
  async search(req: RequestAuthenticated, res: Response) {
    const term = req.params.term.trim().toLowerCase();
    const filter = (req.query.filter || "all") as TFilterTypes;
    const { _page, _limit } = req.query as { _page: string; _limit: string };

    if (!term) {
      throw new AppError("Search term not provided", 404);
    }

    const limitPerRequest =
      filter === "all" ? parseInt(_limit) : Math.floor(parseInt(_limit) / 2);    

    if (filter !== "all") {
      if (filter === "groups") {
        const groups = await getGroups(
          term,
          limitPerRequest,
          parseInt(_page)
        );
        return res.status(200).json(groups);
      } else {
        const users = await getUsers(
          term,
          limitPerRequest,
          parseInt(_page)
        );

        return res.status(200).json(users);
      }
    } else {
      const usersPromised = await getUsers(term, limitPerRequest, parseInt(_page))
      const groupsPromised = await getGroups(term, limitPerRequest, parseInt(_page))
      
      const usersAndGroups = [...usersPromised, ...groupsPromised]

      return res.status(200).json(_.shuffle(usersAndGroups));
    }
  }
}

export { AppController };
