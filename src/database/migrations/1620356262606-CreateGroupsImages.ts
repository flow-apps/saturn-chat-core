import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateGroupsImages1620356262606 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "groupsImages",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "url",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "group_id",
            type: "uuid",
          },
        ],
        foreignKeys: [
          {
            name: "FKGroupImage",
            columnNames: ["group_id"],
            referencedTableName: "groups",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
