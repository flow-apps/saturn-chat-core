import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserNotifications1626654074040
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "user_notifications",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "user_id",
            type: "varchar",
          },
          {
            name: "notification_token",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "platform",
            type: "varchar",
          },
          {
            name: "is_revoked",
            type: "boolean",
            default: false
          },
          {
            name: "send_notification",
            type: "boolean",
            default: true
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
      }), true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("user_notifications");
  }
}
