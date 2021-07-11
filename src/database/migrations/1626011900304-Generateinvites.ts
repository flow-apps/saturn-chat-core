import {MigrationInterface, QueryRunner} from "typeorm";

export class invites1626011900304 implements MigrationInterface {
    name = 'invites1626011900304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invites" ADD "expire_timezone" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invites" DROP COLUMN "expire_timezone"`);
    }

}
