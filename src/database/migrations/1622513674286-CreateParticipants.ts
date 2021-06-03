import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateParticipants1622513674286 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "participants",
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
            name: "group_id",
            type: "uuid",
          },
          {
            name: "participating_since",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKParticipantID",
            referencedTableName: "participants",
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
          },
          {
            name: "FKGroupID",
            referencedTableName: "groups",
            columnNames: ["group_id"],
            referencedColumnNames: ["id"],
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}