import { storage } from "../configs/storage";
import { join } from "path";
import fs from "fs";

interface UploadFileProps {
  file: Express.Multer.File;
  filename: string;
  inLocal?: boolean;
  path?: string;
}

export interface UploadedFile {
  name: string;
  url: string;
}

async function saveInLocal(file: Express.Multer.File, filename: string) {
  fs.writeFileSync(
    join(__dirname, "..", "..", "uploads", "files", filename),
    file.buffer
  );
  return {
    name: filename,
    url: `${process.env.API_URL}/uploads/${filename}`,
  };
}

async function uploadFile({ file, filename, inLocal, path }: UploadFileProps) {
  if (inLocal) return saveInLocal(file, filename);

  const bucket = storage.bucket(process.env.FIREBASE_STORAGE_URL);
  try {
    const uploadFile = bucket.file(`${path}/${filename}`);
    const fileStream = uploadFile.createWriteStream({
      public: true,
      contentType: file.mimetype,
      metadata: {
        cacheControl:
          "private, must-revalidate, stale-while-revalidate=60, max-age=600",
      },
      gzip: true,
    });

    const uploadedFileInfos = fileStream.on("finish", () => {
      const data: UploadedFile = {
        name: filename,
        url: uploadFile.publicUrl(),
      };

      return data;
    });
    fileStream.end(file.buffer);

    return uploadedFileInfos;
  } catch (error) {
    throw new Error("Error on upload file!");
  }
}

export { uploadFile };
