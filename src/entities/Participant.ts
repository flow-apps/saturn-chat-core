import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Group } from "./Group";
import { User } from "./User";

import { v4 as uuid } from "uuid";

@Entity({ name: "participants" })
class Participant {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.participating, {
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  group_id: string;

  @ManyToOne(() => Group, (group) => group.participants, {
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

  @CreateDateColumn()
  participating_since: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Participant };
