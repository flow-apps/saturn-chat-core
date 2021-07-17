import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateReadMessages1626483767475 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "read_messages",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "message_id",
            type: "varchar",
          },
          {
            name: "user_id",
            type: "varchar",
          },
          {
            name: "group_id",
            type: "varchar"
          },
          {
            name: "read_at",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKMessageID",
            referencedColumnNames: ["id"],
            referencedTableName: "messages",
            columnNames: ["message_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKUserID",
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            columnNames: ["user_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKGroupID",
            referencedColumnNames: ["id"],
            referencedTableName: "groups",
            columnNames: ["group_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("read_messages");
  }
}
