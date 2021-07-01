import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAudios1625073264140 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "audios",
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
            name: "group_id",
            type: "varchar",
          },
          {
            name: "participant_id",
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
            name: "FKParticipantID",
            referencedTableName: "participants",
            referencedColumnNames: ["id"],
            columnNames: ["participant_id"],
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
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("audios");
  }
}
