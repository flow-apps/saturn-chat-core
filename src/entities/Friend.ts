import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { FriendsState } from "../database/enums/friends";
import { User } from "./User";

@Entity({ name: "friends" })
class Friend {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  requested_by_id: string;

  @Column()
  received_by_id: string;

  @ManyToOne(() => User, user => user.id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
    eager: true
  })
  @JoinColumn({ name: "requested_by_id" })
  requested_by: User;

  @ManyToOne(() => User, user => user.id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
    eager: true
  })
  @JoinColumn({ name: "received_by_id" })
  received_by: User;

  @Column({
    type: "enum",
    enum: FriendsState,
    default: FriendsState.NONE,
  })
  state: string;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Friend };
