import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Group } from "./Group";
import { Participant } from "./Participant";

@Entity({ name: "participants_settings" })
class ParticipantSetting {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  participant_id: string;

  @Column()
  setting_name: string;

  @Column()
  setting_value: string;

  @Column()
  typeof_value: string;

  @Column()
  input_type: string;

  @ManyToOne(() => Participant, (part) => part.participant_settings, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinColumn({ name: "participant_id" })
  participant: Participant;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { ParticipantSetting };
