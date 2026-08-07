import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Group } from "./Group";

@Entity({ name: "groups_avatars" })
export class GroupAvatar {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  url: string;

  @Column()
  path: string;

  @Column()
  group_id: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: "group_id" })
  group: Group;

  @CreateDateColumn()
  created_at: Date;

  @AfterLoad()
  setUrl() {
    if (this.id) {
      this.url = `${process.env.API_URL || ""}/files/${this.id}`.replace(
        /\/$/,
        ""
      );
    }
  }

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}