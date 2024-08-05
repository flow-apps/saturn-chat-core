import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Group } from "./Group";
import { defaultGroupSettings } from "../configs/defaults/group.settings";

@Entity({ name: "groups_settings" })
class GroupSetting {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  group_id: string;

  @Column()
  setting_name: string;

  @Column()
  setting_value: string;

  @Column()
  typeof_value: string;

  @Column()
  input_type: string;

  @ManyToOne(() => Group, (group) => group.group_settings, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

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

export { GroupSetting };
