import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateGroups1621046651260 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "groups",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "owner_id",
            type: "uuid",
          },
          {
            name: "group_avatar_id",
            type: "uuid",
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
          },
          {
            name: "description",
            type: "varchar",
            length: "500",
          },
          {
            name: "privacy",
            type: "varchar",
          },
          {
            name: "tags",
            type: "varchar[]",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKOwnerID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["owner_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKGroupAvatarID",
            referencedTableName: "groups_avatars",
            referencedColumnNames: ["id"],
            columnNames: ["group_avatar_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("groups");
  }
}
