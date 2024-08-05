import { ParticipantRole } from "../../database/enums/participants";
import { MaxParticipantsType } from "../../types/enums";

const defaultGroupSettings = {
  notify_new_participants: {
    input_type: "switch",
    value: true
  },
  accepting_new_users: {
    input_type: "switch",
    value: false
  },
  minimum_role_for_send_message: {
    input_type: "participant_role",
    value: ParticipantRole.PARTICIPANT
  },
};

export { defaultGroupSettings };
