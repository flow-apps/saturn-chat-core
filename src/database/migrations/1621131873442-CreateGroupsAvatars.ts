import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateGroupsAvatars1621131873442 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "groups_avatars",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "group_id",
            type: "varchar"
          },
          {
            name: "name",
            type: "varchar",
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
            name: "FKGroupID",
            referencedTableName: "groups",
            referencedColumnNames: ["id"],
            columnNames: ["group_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("groups_avatars");
  }
}
