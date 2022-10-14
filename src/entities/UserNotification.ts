import { Column, Entity, PrimaryColumn } from "typeorm";
import { v4 as uuid } from "uuid";

@Entity({ name: "user_notifications" })
class UserNotification {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  readonly user_id: string;

  @Column()
  platform: string;

  @Column({ nullable: true })
  language: string;

  @Column({ default: false })
  is_revoked: boolean;

  @Column({ default: true })
  send_notification: boolean;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { UserNotification };
