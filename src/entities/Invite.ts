import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { InviteType } from "../database/enums/invites";
import { Friend } from "./Friend";
import { Group } from "./Group";
import { User } from "./User";

@Entity({ name: "invites" })
class Invite {
  @PrimaryColumn()
  readonly id: string;

  @Column({
    type: "enum",
    enum: InviteType,
    nullable: true
  })
  type: string;

  @Column()
  readonly group_id: string;

  @Column({ nullable: true })
  readonly friend_id: string;

  @Column({ nullable: true })
  readonly sended_by_id: string;

  @Column({ nullable: true })
  readonly received_by_id: string;

  @ManyToOne(() => User, (user) => user.sended_invites, {
    cascade: true,
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "sended_by_id" })
  sended_by: User;

  @ManyToOne(() => User, (user) => user.received_invites, {
    cascade: true,
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "received_by_id" })
  received_by: User;

  @ManyToOne(() => Group, (group) => group.invites, {
    cascade: true,
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

  @ManyToOne(() => Friend, (friend) => friend.invites, {
    cascade: true,
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "friend_id" })
  friend: Friend;

  @Column({ unique: true })
  invite_code: string;

  @Column({ default: false })
  is_permanent: boolean;

  @Column({ default: false })
  is_unlimited_usage: boolean;

  @Column({ default: 0 })
  max_usage_amount: number;

  @Column({ default: 1 })
  usage_amount: number;

  @Column({ nullable: true })
  expire_in: Date;

  @Column()
  expire_timezone: string;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Invite };
