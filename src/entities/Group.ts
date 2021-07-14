import { v4 as uuid } from "uuid";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { GroupAvatar } from "./GroupAvatar";
import { Message } from "./Message";
import { Participant } from "./Participant";
import { Invite } from "./Invite";

@Entity({ name: "groups" })
class Group {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  owner_id: string;
  
  @OneToOne(() => GroupAvatar, { nullable: true })
  @JoinColumn()
  group_avatar: GroupAvatar;

  @OneToMany(() => Message, (message) => message.id)
  @JoinColumn()
  messages: Message[];

  @OneToMany(() => Participant, (participant) => participant.group)
  @JoinColumn()
  participants: Participant[];

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500 })
  description: string;

  @Column()
  privacy: string;

  @Column("varchar", { array: true, nullable: true, default: [] })
  tags: string[];

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: "owner_id" })
  owner: User;

  @OneToMany(() => Invite, (invite) => invite.group, {
    nullable: true,
  })
  @JoinColumn()
  invites: Invite[];

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

export { Group };
