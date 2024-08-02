import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  UpdateDateColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Avatar } from "./Avatar";
import { Friend } from "./Friend";
import { Group } from "./Group";
import { Invite } from "./Invite";
import { Participant } from "./Participant";
import { UserNotification } from "./UserNotification";
import { Subscription } from "./Subscription";
@Entity({ name: "users" })
class User {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  name: string;

  @Column({ type: "varchar", nullable: true, unique: true })
  nickname?: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ select: false })
  email: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => Invite, (invite) => invite.sended_by)
  @JoinColumn()
  sended_invites: Invite[];

  @OneToMany(() => Invite, (invite) => invite.received_by)
  @JoinColumn()
  received_invites: Invite[];

  @OneToOne(() => UserNotification, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  user_notifications: UserNotification;

  @OneToMany(() => Group, (group) => group.owner)
  @JoinColumn()
  groups: Group[];

  @OneToMany(() => Subscription, (sub) => sub.user)
  @JoinColumn()
  subscriptions: Subscription[];

  @OneToMany(() => Friend, (friend) => friend.requested_by)
  @JoinColumn()
  friends_requested: Friend[];

  @OneToMany(() => Friend, (friend) => friend.received_by)
  @JoinColumn()
  friends_received: Friend[];

  @OneToOne(() => Avatar, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
    eager: true,
  })
  @JoinColumn()
  avatar: Avatar;

  @OneToMany(() => Participant, (participant) => participant.user)
  @JoinColumn()
  participating: Participant[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  isPremium: boolean;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { User };
