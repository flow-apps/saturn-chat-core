import { ParticipantRole } from "../../database/enums/participants";

const defaultGroupSettings = {
  notify_new_participants: true,
  accepting_new_users: true,
  minimal_role_for_message: ParticipantRole.PARTICIPANT,
};

export { defaultGroupSettings };
