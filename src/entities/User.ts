import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Avatar } from "./Avatar";
import { Group } from "./Group";

@Entity({ name: "users" })
class User {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Group, (group) => group.owner)
  groups: Group[];

  @OneToOne(() => Avatar, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinColumn()
  avatar: Avatar;

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
