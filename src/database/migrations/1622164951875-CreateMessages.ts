import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateMessages1622164951875 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "messages",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "author_id",
            type: "uuid",
          },
          {
            name: "participant_id",
            type: "uuid",
            isNullable: true
          },
          {
            name: "group_id",
            type: "uuid",
          },
          {
            name: "message",
            type: "varchar",
            length: "5000",
            isNullable: true
          },
          {
            name: "voice_message_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
        ],
        foreignKeys: [
          {
            name: "FKAuthorID",
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            columnNames: ["author_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
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
          {
            name: "FKVoiceMessageID",
            referencedTableName: "audios",
            referencedColumnNames: ["id"],
            columnNames: ["voice_message_id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("messages");
  }
}
