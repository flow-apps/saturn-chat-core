import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";
import { Group } from "./Group";

@Entity({ name: "invites" })
class Invite {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  readonly group_id: string;

  @ManyToOne(() => Group, (group) => group.invites, {
    cascade: true,
    nullable: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "group_id" })
  group: Group;

  @Column({ unique: true })
  invite_code: string;

  @Column({ default: false })
  is_permanent: boolean;

  @Column({ default: false })
  is_unlimited_usage: boolean;

  @Column({ default: 1 })
  usage_amount: number;

  @Column({ nullable: true })
  expire_in: Date;

  @CreateDateColumn()
  created_at: Date;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Invite };
