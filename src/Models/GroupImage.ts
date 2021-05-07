import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Group } from "./Group";

@Entity("groups")
class GroupImage {
  @PrimaryGeneratedColumn()
  readonly id: string;

  @OneToOne(() => Group)
  @JoinColumn({ name: "group_id" })
  group: Group;

  @Column()
  url: string;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { GroupImage };
