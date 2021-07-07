import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateFiles1625275540216 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "files",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "name",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "original_name",
            type: "varchar",
          },
          {
            name: "size",
            type: "integer",
          },
          {
            name: "type",
            type: "varchar",
          },
          {
            name: "group_id",
            type: "varchar",
          },
          {
            name: "user_id",
            type: "varchar",
          },
          {
            name: "message_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "url",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "path",
            type: "varchar",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
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
          {
            name: "FKGroupID",
            referencedTableName: "groups",
            referencedColumnNames: ["id"],
            columnNames: ["group_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKMessageID",
            referencedTableName: "messages",
            referencedColumnNames: ["id"],
            columnNames: ["message_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("files");
  }
}
