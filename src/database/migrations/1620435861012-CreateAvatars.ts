import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAvatars1620435861012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "avatars",
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
            name: "name",
            type: "varchar",
          },
          {
            name: "url",
            type: "varchar",
          },
        ],
        foreignKeys: [
          {
            name: "FKUser",
            columnNames: ["user_id"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("avatars");
  }
}
