import { v4 as uuid } from "uuid";
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
import { User } from "./User";
import { GroupAvatar } from "./GroupAvatar";

@Entity({ name: "groups" })
class Group {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  owner_id: string;

  @OneToOne(() => GroupAvatar, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinColumn()
  group_avatar: GroupAvatar;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500 })
  description: string;

  @Column()
  privacy: string;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinColumn({ name: "owner_id" })
  owner: User;

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