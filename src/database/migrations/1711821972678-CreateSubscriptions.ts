import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { PaymentState, SubscriptionPeriod } from "../enums/subscriptions";

export class CreateSubscriptions1711821972678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "subscriptions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "user_id",
            type: "uuid",
          },
          {
            name: "subscription_id",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "package_name",
            type: "varchar",
          },
          {
            name: "payment_state",
            type: "integer",
            default: PaymentState.PENDENT,
          },
          {
            name: "subscription_period",
            type: "integer",
            default: SubscriptionPeriod.MONTHLY,
            isNullable: true
          },
          {
            name: "purchase_type",
            type: "integer",
            isNullable: true,
          },
          {
            name: "auto_renewing",
            type: "boolean",
          },
          {
            name: "cancel_reason",
            type: "integer",
            isNullable: true,
          },
          {
            name: "purchase_token",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "started_at",
            type: "timestamp",
          },
          {
            name: "expiry_in",
            type: "timestamp",
          },
          {
            name: "resume_in",
            type: "timestamp",
            isNullable: true
          },
        ],
        foreignKeys: [
          {
            name: "FKUserID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["user_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("subscriptions");
  }
}
