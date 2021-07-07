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
import { Group } from "./Group";
import { User } from "./User";
import { Audio } from "./Audio";
import { File } from "./File";

@Entity({ name: "messages" })
class Message {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  group_id: string;

  @Column()
  author_id: string;

  @ManyToOne(() => Group, (group) => group.id)
  @JoinColumn({ name: "group_id" })
  group: Group;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "author_id" })
  author: User;

  @Column({ length: 500 })
  message: string;

  @Column({ nullable: true })
  voice_message_id: string;

  @OneToOne(() => Audio, {
    cascade: true,
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "voice_message_id" })
  voice_message: Audio;

  @OneToMany(() => File, (file) => file.message, {
    eager: true,
    nullable: true,
  })
  @JoinColumn()
  files: File[];

  @UpdateDateColumn()
  updated_at: Date;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Message };
