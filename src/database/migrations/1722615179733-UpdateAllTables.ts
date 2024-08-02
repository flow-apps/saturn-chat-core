import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateUserNicknames1722615179733 implements MigrationInterface {
    name = 'UpdateUserNicknames1722615179733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "nickname" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nickname"`);
    }

}
