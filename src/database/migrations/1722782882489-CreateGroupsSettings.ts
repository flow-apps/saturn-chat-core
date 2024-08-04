import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateGroupSettings1722782882489 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "groups_settings",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "group_id",
            type: "varchar",
          },
          {
            name: "setting_name",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "setting_value",
            type: "varchar",
          },
          {
            name: "typeof_value",
            type: "varchar",
          },
          {
            name: "input_type",
            type: "varchar",
          },
        ],
        foreignKeys: [
          {
            name: "FKGroupID",
            columnNames: ["group_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "groups",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("group_settings")
  }
}
