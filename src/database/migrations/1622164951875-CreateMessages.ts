import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateMessages1622164951875 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "messages",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "author_id",
            type: "uuid",
          },
          {
            name: "group_id",
            type: "uuid",
          },
          {
            name: "message",
            type: "varchar",
            length: "500",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKAuthorID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["author_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKGroupID",
            referencedTableName: "groups",
            referencedColumnNames: ["id"],
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
    await queryRunner.dropTable("messages");
  }
}
