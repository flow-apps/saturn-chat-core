import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { User } from "./User";

@Entity("avatars")
class Avatar {
  @PrimaryGeneratedColumn()
  readonly id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  name: string;

  @Column()
  url: string;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Avatar };
