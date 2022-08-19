import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateInvites1625936877597 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "invites",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "type",
            type: "varchar",
            isNullable: true
          },
          {
            name: "invite_code",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "is_permanent",
            type: "boolean",
            default: false,
          },
          {
            name: "is_unlimited_usage",
            type: "boolean",
            default: false,
          },
          {
            name: "max_usage_amount",
            type: "integer",
            default: 1,
          },
          {
            name: "usage_amount",
            type: "integer",
            default: 0,
          },
          {
            name: "expire_in",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "expire_timezone",
            type: "varchar"
          },
          {
            name: "group_id",
            type: "varchar",
          },
          {
            name: "friend_id",
            type: "varchar",
            isNullable: true
          },
          {
            name: "sended_by_id",
            type: "varchar",
            isNullable: true
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKGroupID",
            referencedColumnNames: ["id"],
            referencedTableName: "groups",
            columnNames: ["group_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKFriendID",
            referencedColumnNames: ["id"],
            referencedTableName: "friends",
            columnNames: ["friend_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKSendedByID",
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            columnNames: ["sended_by_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("invites");
  }
}
