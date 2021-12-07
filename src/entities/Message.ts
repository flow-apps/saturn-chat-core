import { v4 as uuid } from "uuid";
import {
  BeforeRemove,
  Column,
  CreateDateColumn,
  Entity,
  getCustomRepository,
  JoinColumn,
  ManyToMany,
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
import { ReadMessage } from "./ReadMessage";
import { Participant } from "./Participant";

@Entity({ name: "messages" })
class Message {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  group_id: string;

  @Column()
  author_id: string;

  @Column({ nullable: true })
  participant_id: string;

  @ManyToOne(() => Group, (group) => group.id, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "author_id" })
  author: User;

  @ManyToOne(() => Participant, (participant) => participant.id, {
    eager: true,
    nullable: true,
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  })
  @JoinColumn({ name: "participant_id" })
  participant: Participant;

  @Column({ length: 5000, default: "" })
  message: string;

  @ManyToOne(() => ReadMessage, (rm) => rm.message)
  @JoinColumn()
  read_messages: ReadMessage[];

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
