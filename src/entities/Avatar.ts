import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";

@Entity({ name: "avatars" })
export class Avatar {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  url: string;

  @Column()
  path: string;

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