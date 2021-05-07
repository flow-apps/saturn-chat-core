import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Group } from "./Group";

@Entity("users")
class User {
  @PrimaryGeneratedColumn()
  readonly id: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: "owner_id" })
  groups: Group[];

  @Column()
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { User };
