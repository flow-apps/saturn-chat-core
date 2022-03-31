import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateFriends1648677867244 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "friends",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "requested_by_id",
            type: "varchar",
          },
          {
            name: "received_by_id",
            type: "varchar",
          },
          {
            name: "state",
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
            name: "FKRequestedByID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["requested_by_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          {
            name: "FKReceivedByID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["received_by_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("friends");
  }
}
