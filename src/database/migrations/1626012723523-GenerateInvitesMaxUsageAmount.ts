import {MigrationInterface, QueryRunner} from "typeorm";

export class GenerateInvitesMaxUsageAmount1626012723523 implements MigrationInterface {
    name = 'GenerateInvitesMaxUsageAmount1626012723523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invites" ADD "max_usage_amount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invites" DROP COLUMN "max_usage_amount"`);
    }

}
