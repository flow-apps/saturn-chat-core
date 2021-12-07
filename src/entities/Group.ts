import { v4 as uuid } from "uuid";
import {
  BeforeRemove,
  Column,
  CreateDateColumn,
  Entity,
  getCustomRepository,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { GroupAvatar } from "./GroupAvatar";
import { Message } from "./Message";
import { Participant } from "./Participant";
import { Invite } from "./Invite";
import { ReadMessage } from "./ReadMessage";
import { StorageManager } from "../services/StorageManager";
import { MessagesRepository } from "../repositories/MessagesRepository";
import { io } from "../websockets";
import { GroupType } from "../database/enums/groups";
import { BanParticipant } from "./BanParticipant";

@Entity({ name: "groups" })
class Group {
  @BeforeRemove()
  async deleteAllFiles() {
    const storage = new StorageManager();
    const messagesRepository = getCustomRepository(MessagesRepository);
    const messages = await messagesRepository.find({
      where: { group_id: this.id },
      loadEagerRelations: true,
    });

    if (this.group_avatar) {
      await storage.deleteFile(this.group_avatar.path);
    }

    if (messages.length <= 0) return;

    Promise.all(messages.map(async (message) => {
        const files = message.files;
        const voiceMessage = message.voice_message;

        if (voiceMessage) {
          await storage.deleteFile(voiceMessage.path);
        }

        if (files.length > 0) {
          await Promise.all(files.map(async (file) => {
              await storage.deleteFile(file.path);
          }))
        }
    }));

    io.to(this.id).emit("deleted_group", this.id)
    io.socketsLeave(this.id)
  }

  @PrimaryColumn()
  readonly id: string;

  @Column()
  owner_id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, default: "" })
  description: string;

  @Column()
  privacy: string;

  @Column("varchar", { array: true, nullable: true, default: [] })
  tags: string[];

  @OneToOne(() => GroupAvatar, {
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  group_avatar: GroupAvatar;

  @OneToMany(() => ReadMessage, (rm) => rm.group)
  @JoinColumn()
  read_messages: ReadMessage[];

  @OneToMany(() => BanParticipant, (bp) => bp.group)
  @JoinColumn()
  ban_participants: BanParticipant[];

  @OneToMany(() => Message, (message) => message.id)
  @JoinColumn()
  messages: Message[];

  @OneToMany(() => Participant, (participant) => participant.group)
  @JoinColumn()
  participants: Participant[];

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: "owner_id" })
  owner: User;

  @OneToMany(() => Invite, (invite) => invite.group, {
    nullable: true,
  })
  @JoinColumn()
  invites: Invite[];

  @Column({
    type: "enum",
    enum: GroupType,
    default: GroupType.GROUP
  })
  type: string;

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

export { Group };
