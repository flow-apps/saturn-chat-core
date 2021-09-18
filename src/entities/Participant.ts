import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Group } from "./Group";
import { User } from "./User";

import { v4 as uuid } from "uuid";
import { ParticipantRole, ParticipantStatus } from "../database/enums/participants";

@Entity({ name: "participants" })
class Participant {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.participating, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  group_id: string;

  @ManyToOne(() => Group, (group) => group.participants, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

  @Column({
    type: "enum",
    enum: ParticipantStatus,
    default: ParticipantStatus.OFFLINE
  })
  status: ParticipantStatus;

  @Column({
    type: "enum",
    enum: ParticipantRole,
    default: ParticipantRole.PARTICIPANT
  })
  role: ParticipantRole;

  @CreateDateColumn()
  participating_since: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Participant };
