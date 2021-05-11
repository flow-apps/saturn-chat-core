import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { User } from "./User";

@Entity("avatars")
class Avatar {
  @PrimaryColumn()
  readonly id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  url: string;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Avatar };
