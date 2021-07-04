import { EntityRepository, Repository } from "typeorm";
import { File } from "../entities/File";

@EntityRepository(File)
class FilesRepository extends Repository<File> {}

export { FilesRepository };
