import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateGroupTypeOf1722895131341 implements MigrationInterface {
    name = 'UpdateGroupTypeOf1722895131341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP CONSTRAINT "FKGroupID"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_7cfd923277f6ef9f89b04c60436"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "REL_7cfd923277f6ef9f89b04c6043"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_ad02a1be8707004cb805a4b5023" UNIQUE ("nickname")`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP CONSTRAINT "PK_0388ba86ae720cb939ce4d65e72"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD CONSTRAINT "PK_0388ba86ae720cb939ce4d65e72" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP CONSTRAINT "UQ_8ebdcbf986cd17180a871088c17"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD CONSTRAINT "FK_786b56623d49289c004c25ca5ba" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP CONSTRAINT "FK_786b56623d49289c004c25ca5ba"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD CONSTRAINT "UQ_8ebdcbf986cd17180a871088c17" UNIQUE ("setting_name")`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP CONSTRAINT "PK_0388ba86ae720cb939ce4d65e72"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD "id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD CONSTRAINT "PK_0388ba86ae720cb939ce4d65e72" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_ad02a1be8707004cb805a4b5023"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "group_id" character varying`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "REL_7cfd923277f6ef9f89b04c6043" UNIQUE ("group_id")`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "FK_7cfd923277f6ef9f89b04c60436" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD CONSTRAINT "FKGroupID" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
