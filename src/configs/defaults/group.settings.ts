import { ParticipantRole } from "../../database/enums/participants";
import { MaxParticipantsType } from "../../types/enums";

const defaultGroupSettings = {
  notify_new_participants: {
    input_type: "radio",
    value: true
  },
  accepting_new_users: {
    input_type: "radio",
    value: true
  },
  minimal_role_for_message: {
    input_type: "select",
    value: ParticipantRole.PARTICIPANT
  },
  max_participants: {
    input_type: "number",
    value: MaxParticipantsType.NO_LIMIT
  }
};

export { defaultGroupSettings };
