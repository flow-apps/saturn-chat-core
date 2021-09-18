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
import { Group } from "./Group";
import { Participant } from "./Participant";
import { UserNotification } from "./UserNotification";

@Entity({ name: "users" })
class User {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  bio: string;

  @Column()
  email: string;

  @Column({ select: false })
  password: string;

  @OneToOne(() => UserNotification, {
    nullable: true,
    cascade: true
  })
  @JoinColumn()
  user_notifications: UserNotification

  @OneToMany(() => Group, (group) => group.owner)
  @JoinColumn()
  groups: Group[];

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

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { User };
