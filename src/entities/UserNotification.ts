import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";
import { v4 as uuid } from "uuid";

@Entity({ name: "user_notifications" })
class UserNotification {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  readonly user_id: string;

  @Column({ unique: true })
  notification_token: string

  @Column()
  platform: string

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { UserNotification };
