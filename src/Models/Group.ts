import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { GroupImage } from "./GroupImage";
import { User } from "./User";

@Entity("groups")
class Group {
  @PrimaryGeneratedColumn()
  readonly id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "owner_id" })
  owner: User;

  @OneToOne(() => GroupImage, (groupImage) => groupImage.group, {
    cascade: ["insert", "update"],
  })
  @JoinColumn()
  image: GroupImage;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  privacy: string;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
    this.privacy = this.privacy.toUpperCase();
  }
}

export { Group };
