import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateBanParticipants1638633853343 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "ban_participants",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "banned_user_id",
            type: "uuid",
          },
          {
            name: "requested_by_user_id",
            type: "uuid",
          },
          {
            name: "group_id",
            type: "uuid",
          },
          {
            name: "banned_at",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKBannedUserID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["banned_user_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKRequestedByUserID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["requested_by_user_id"],
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
      await queryRunner.dropTable("ban_participants")
  }
}
