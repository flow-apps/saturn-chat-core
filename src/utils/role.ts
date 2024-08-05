import _ from "lodash";
import { ParticipantRole } from "../database/enums/participants";

export const ordernedRolesArray = [
  ParticipantRole.PARTICIPANT,
  ParticipantRole.MODERATOR,
  ParticipantRole.MANAGER,
  ParticipantRole.ADMIN,
  ParticipantRole.OWNER,
];
export const checkIsMinimumRole = (
  minimumRole: string,
  role: string
) => {
  const participantRoleIndex = _.findIndex(ordernedRolesArray, role);
  const minimumRoleSendMessageIndex = _.findIndex(
    ordernedRolesArray,
    minimumRole
  );
  const isMinimumRole = participantRoleIndex >= minimumRoleSendMessageIndex;
  return isMinimumRole;
};
