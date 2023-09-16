import fs from "fs";
import { storage } from "../configs/storage";
import { join } from "path";
import { Bucket } from "@google-cloud/storage";
import { randomBytes } from "crypto";
import { clearFilename } from "../utils/clear";

interface UploadFileProps {
  file: Express.Multer.File;
  inLocal?: boolean;
  path?: string;
}

interface UploadMultipleFilesProps {
  files: Express.Multer.File[];
  path?: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
  original_name: string;
  size: number;
  type: string;
}

class StorageManager {
  private bucket: Bucket;

  constructor() {
    this.bucket = storage.bucket(process.env.FIREBASE_STORAGE_URL);
  }

  private async saveInLocal(
    file: Express.Multer.File,
    filename: string,
    original_name: string,
    fileType: string
  ) {
    fs.writeFileSync(
      join(__dirname, "..", "..", "uploads", "files", filename),
      file.buffer
    );
    return {
      name: filename,
      original_name,
      url: `${process.env.API_URL}/uploads/${filename}`,
      path: join("..", "..", "uploads", "files", filename),
      size: file.size,
      type: fileType,
    };
  }

  async uploadFile({
    file,
    inLocal = process.env.NODE_ENV !== "prod",
    path,
  }: UploadFileProps) {
    const originalName = clearFilename(file.originalname);
    const randomString = randomBytes(30).toString("hex");
    const filename = `${randomString}_${originalName}`;
    const fileType = file.mimetype.split("/")[0];

    if (inLocal)
      return this.saveInLocal(file, filename, originalName, fileType);
    try {
      return new Promise<UploadedFile>((resolve, reject) => {
        const uploadFile = this.bucket.file(`files/${path}/${filename}`);
        const fileStream = uploadFile.createWriteStream({
          public: true,
          contentType: file.mimetype,
          metadata: {
            cacheControl:
              "private, must-revalidate, stale-while-revalidate=60, max-age=600",
          },
          gzip: true,
        });

        fileStream.on("finish", () => {
          const data: UploadedFile = {
            name: filename,
            original_name: originalName,
            url: uploadFile.publicUrl(),
            path: uploadFile.name,
            size: file.size,
            type: fileType,
          };
          resolve(data);
        });

        fileStream.end(file.buffer);
      });
    } catch (error) {
      console.log(error);
      throw new Error("Error on upload file!");
    }
  }

  async uploadMultipleFiles({ files, path }: UploadMultipleFilesProps) {
    try {
      const sendedFiles = files.map(async (file) => {
        const sendedFile = await this.uploadFile({ file, path });

        if (sendedFile) {
          return sendedFile as UploadedFile;
        }
      });

      const promisedFiles = await Promise.all(sendedFiles);

      return promisedFiles;
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteFile(
    path: string,
    InLocal = process.env.NODE_ENV !== "prod"
  ) {
    try {
      if (InLocal) {
        fs.unlinkSync(join(__dirname, path));
        return;
      }
      await this.bucket.file(path).delete();
    } catch (error) {
      console.log(error);
      throw new Error("Error on delete file!");
    }
  }
}

export { StorageManager };
