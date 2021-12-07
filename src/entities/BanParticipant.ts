import { v4 as uuid } from "uuid";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User";
import { Group } from "./Group";

@Entity({ name: "ban_participants" })
class BanParticipant {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  banned_user_id: string;

  @Column()
  requested_by_user_id: string;

  @Column()
  group_id: string;

  @ManyToOne(() => User, {
    cascade: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "banned_user_id" })
  banned_user: User;

  @ManyToOne(() => Group, {
    cascade: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

  @ManyToOne(() => User, {
    cascade: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "requested_by_user_id" })
  requested_by_user: User;

  @CreateDateColumn()
  banned_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { BanParticipant };
