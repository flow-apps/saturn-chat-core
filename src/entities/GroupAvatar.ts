import { BeforeRemove, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { v4 as uuid } from "uuid";
import { StorageManager } from "../services/StorageManager";
import { Group } from "./Group";

@Entity({ name: "groups_avatars" })
class GroupAvatar {

  @PrimaryColumn()
  readonly id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  url: string;

  @Column()
  path: string;

  @Column()
  group_id: string;

  @OneToOne(() => Group, group => group.group_avatar, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "group_id" })
  group: Group

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { GroupAvatar };
