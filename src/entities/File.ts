import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Message } from "./Message";

@Entity({ name: "files" })
class File {
  @PrimaryColumn()
  readonly id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  original_name: string;

  @Column({ default: 0 })
  size: number;

  @Column({ unique: true })
  url: string;

  @Column()
  user_id: string;

  @Column()
  group_id: string;

  @Column({ nullable: true, default: "" })
  message_id: string;

  @ManyToOne(() => Message, (file) => file.files, {
    cascade: true,
    nullable: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "message_id" })
  message: Message;

  @Column({ select: false })
  path: string;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { File };
