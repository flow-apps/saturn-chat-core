import { storage } from "../configs/storage";
import { join } from "path";
import fs from "fs";
import { Bucket } from "@google-cloud/storage";

interface UploadFileProps {
  file: Express.Multer.File;
  filename: string;
  inLocal?: boolean;
  path?: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
}

class StorageManager {
  private bucket: Bucket;

  constructor() {
    this.bucket = storage.bucket(process.env.FIREBASE_STORAGE_URL);
  }

  private async saveInLocal(file: Express.Multer.File, filename: string) {
    fs.writeFileSync(
      join(__dirname, "..", "..", "uploads", "files", filename),
      file.buffer
    );
    return {
      name: filename,
      url: `${process.env.API_URL}/uploads/${filename}`,
      path: join(__dirname, "..", "..", "uploads", "files", filename),
    };
  }

  async uploadFile({ file, filename, inLocal, path }: UploadFileProps) {
    if (inLocal) return this.saveInLocal(file, filename);
    try {
      return new Promise((resolve, reject) => {
        const uploadFile = this.bucket.file(`${path}/${filename}`);
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
            url: uploadFile.publicUrl(),
            path: uploadFile.name,
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

  async deleteFile(path: string, InLocal?: boolean) {
    try {
      if (InLocal) {
        fs.unlinkSync(path);
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
