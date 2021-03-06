import { v4 as uuid } from "uuid";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User";
import { Message } from "./Message";
import { Group } from "./Group";

@Entity({ name: "read_messages" })
class ReadMessage {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  message_id: string;

  @Column()
  user_id: string;

  @Column()
  group_id: string;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Message, (message) => message.read_messages, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "message_id" })
  message: Message;

  @ManyToOne(() => Group, (group) => group.read_messages, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

  @CreateDateColumn()
  read_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { ReadMessage };
