import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Avatar } from "./Avatars";
import { Group } from "./Group";

@Entity("users")
class User {
  @PrimaryGeneratedColumn()
  readonly id: string;

  @OneToOne(() => Avatar, (avatar) => avatar.url)
  @JoinColumn()
  avatar: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: "owner_id" })
  groups: Group[];

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { User };
