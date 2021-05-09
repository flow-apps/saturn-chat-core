import { storage } from "../configs/storage";
import { join } from "path";
import fs from "fs";

interface UploadFileProps {
  file: Express.Multer.File;
  filename: string;
  inLocal?: boolean;
  path?: string;
}

async function uploadFile({ file, filename, inLocal, path }: UploadFileProps) {
  if (inLocal) {
    fs.writeFileSync(
      join(__dirname, "..", "..", "uploads", "files", filename),
      file.buffer
    );
    return {
      name: filename,
      url: `${process.env.API_URL}/${filename}`,
    };
  }
  const bucket = storage.bucket(process.env.FIREBASE_STORAGE_URL);
  return new Promise((resolve, reject) => {
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

      fileStream.on("finish", () => {
        const data = {
          name: filename,
          url: uploadFile.publicUrl(),
        };

        resolve(data);
      });

      fileStream.end(file.buffer);
    } catch (error) {
      reject(error);
    }
  });
}

export { uploadFile };
