import { v4 as uuid } from "uuid";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User";
import {
  CancelReasonType,
  PaymentState,
  PurchaseType,
} from "../database/enums/subscriptions";

@Entity({ name: "subscriptions" })
class Subscription {
  @PrimaryColumn()
  readonly id: string;

  @Column()
  user_id: string;

  @Column({ unique: true })
  subscription_id: string;

  @Column({ unique: true })
  purchase_token: string;

  @Column()
  package_name: string;

  @Column({ type: "enum", enum: PaymentState, default: PaymentState.PENDENT })
  payment_state: PaymentState;

  @Column({ type: "enum", enum: PurchaseType, nullable: true })
  purchase_type: PurchaseType;

  @Column({ type: "boolean" })
  auto_renewing: boolean;

  @Column({ type: "enum", enum: CancelReasonType })
  cancel_reason: CancelReasonType;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
    eager: true,
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "integer" })
  started_at: number;

  @Column({ type: "integer" })
  expiry_in: number;

  @Column({ type: "integer", nullable: true })
  resume_in: number;

  constructor() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export { Subscription };