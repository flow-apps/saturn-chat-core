import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateAddInputTypeGroupsSettings1722787949574 implements MigrationInterface {
    name = 'UpdateAddInputTypeGroupsSettings1722787949574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD "typeof_value" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups_settings" ADD "input_type" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP COLUMN "input_type"`);
        await queryRunner.query(`ALTER TABLE "groups_settings" DROP COLUMN "typeof_value"`);
    }

}
