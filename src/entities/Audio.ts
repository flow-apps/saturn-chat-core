import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuid } from "uuid";

@Entity({ name: "audios" })
class Audio {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  size: number;

  @Column({ default: 0 })
  duration: number;

  @Column({ unique: true })
  url: string;

  @Column()
  participant_id: string;

  @Column()
  group_id: string;

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

export { Audio };
