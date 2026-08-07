import fs from "fs";
import { storage } from "../configs/storage";
import { basename, join } from "path";
import { Bucket } from "@google-cloud/storage";
import { randomBytes } from "crypto";
import { clearFilename } from "../utils/clear";
import {
  BlobServiceClient,
  BlobSASPermissions,
  ContainerClient,
  generateBlobSASQueryParameters,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { getRepository } from "typeorm";
import { File } from "../entities/File";
import { GroupAvatar } from "../entities/GroupAvatar";
import { Avatar } from "../entities/Avatar";
import { Audio } from "../entities/Audio";

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
  private containerClient: ContainerClient;
  private provider: "firebase" | "azure";
  private inLocal: boolean;
  private containerName: string;

  private getLocalPublicUrl(pathOrUrl: string) {
    if (!pathOrUrl) {
      return "";
    }

    const filename = basename(pathOrUrl);
    const apiUrl = (process.env.API_URL || "").replace(/\/$/, "");

    if (!filename) {
      return `${apiUrl}/uploads`;
    }

    return `${apiUrl}/uploads/${encodeURIComponent(filename)}`;
  }

  constructor() {
    this.inLocal = process.env.NODE_ENV === "development";
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "";
    console.log("[STORAGE] usando bucket local:", this.inLocal);

    if (!this.inLocal) {
      this.provider =
        process.env.STORAGE_PROVIDER === "azure" ? "azure" : "firebase";

      if (this.provider === "azure") {
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING,
        );
        this.containerClient = blobServiceClient.getContainerClient(
          this.containerName,
        );
        console.log("[STORAGE] Usando Azure Blob Storage");
      } else {
        this.bucket = storage.bucket(process.env.FIREBASE_STORAGE_URL);
        console.log("[STORAGE] Usando Firebase Storage");
      }
    }
  }

  private toBlobName(pathOrUrl: string) {
    if (!pathOrUrl) {
      return "";
    }

    if (pathOrUrl.startsWith("http")) {
      try {
        const url = new URL(pathOrUrl);
        return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      } catch {
        return pathOrUrl;
      }
    }

    return pathOrUrl.replace(/^\/+/, "");
  }

  async getFileAccessUrl(pathOrUrl: string, expiresInSeconds = 900) {
    if (!pathOrUrl) {
      return "";
    }

    if (this.inLocal || this.provider !== "azure") {
      if (pathOrUrl.startsWith("http")) {
        return pathOrUrl;
      }

      if (this.bucket) {
        return this.bucket.file(pathOrUrl).publicUrl();
      }

      return this.getLocalPublicUrl(pathOrUrl);
    }

    const blobName = this.toBlobName(pathOrUrl);
    const blobClient = this.containerClient.getBlobClient(blobName);

    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      return blobClient.url;
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/i);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/i);

    if (!accountNameMatch?.[1] || !accountKeyMatch?.[1]) {
      return blobClient.url;
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountNameMatch[1],
      accountKeyMatch[1],
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse("r"),
        protocol: SASProtocol.Https,
        startsOn: new Date(Date.now() - 60 * 1000),
        expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
      },
      sharedKeyCredential,
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  async downloadFile(pathOrUrl: string) {
    if (!pathOrUrl) {
      return Buffer.from("");
    }

    if (this.inLocal) {
      const fullPath = pathOrUrl.startsWith("/") ? pathOrUrl : join(process.cwd(), pathOrUrl);
      return fs.readFileSync(fullPath);
    }

    if (this.provider === "azure") {
      const blobName = this.toBlobName(pathOrUrl);
      const blobClient = this.containerClient.getBlobClient(blobName);
      const downloadResponse = await blobClient.download();
      const chunks: Buffer[] = [];

      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    }

    const blobName = this.toBlobName(pathOrUrl);
    const [buffer] = await this.bucket.file(blobName).download();
    return buffer;
  }

  private async saveInLocal(
    file: Express.Multer.File,
    filename: string,
    original_name: string,
    fileType: string,
  ): Promise<UploadedFile> {
    const filePath = join(process.cwd(), "uploads", "files", filename);
    fs.writeFileSync(filePath, file.buffer);
    return {
      name: filename,
      original_name,
      url: this.getLocalPublicUrl(filePath),
      path: filePath,
      size: file.size,
      type: fileType,
    };
  }

  private async uploadToFirebase({
    file,
    path,
    filename,
    originalName,
    fileType,
  }: {
    file: Express.Multer.File;
    path: string;
    filename: string;
    originalName: string;
    fileType: string;
  }): Promise<UploadedFile> {
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

      fileStream.on("error", (err) => {
        reject(err);
      });

      fileStream.end(file.buffer);
    });
  }

  private async uploadToAzure({
    file,
    path,
    filename,
    originalName,
    fileType,
  }: {
    file: Express.Multer.File;
    path: string;
    filename: string;
    originalName: string;
    fileType: string;
  }): Promise<UploadedFile> {
    const blobName = `files/${path}/${filename}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl:
          "private, must-revalidate, stale-while-revalidate=60, max-age=600",
      },
    });

    return {
      name: filename,
      original_name: originalName,
      url: blockBlobClient.url,
      path: blobName,
      size: file.size,
      type: fileType,
    };
  }

  async uploadFile({ file, path }: UploadFileProps): Promise<UploadedFile> {
    const originalName = clearFilename(file.originalname);
    const randomString = randomBytes(30).toString("hex");
    const filename = `${randomString}_${originalName}`;
    const fileType = file.mimetype.split("/")[0];

    if (this.inLocal)
      return await this.saveInLocal(file, filename, originalName, fileType);
    try {
      if (this.provider === "azure") {
        return await this.uploadToAzure({
          file,
          path,
          filename,
          originalName,
          fileType,
        });
      } else {
        return await this.uploadToFirebase({
          file,
          path,
          filename,
          originalName,
          fileType,
        });
      }
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

  private async deleteFromFirebase(path: string) {
    await this.bucket.file(path).delete();
  }

  private async deleteFromAzure(path: string) {
    await this.containerClient.deleteBlob(path);
  }

  async deleteFile(path: string) {
    try {
      if (this.inLocal) {
        fs.unlinkSync(path);
        return;
      }
      if (this.provider === "azure") {
        await this.deleteFromAzure(path);
      } else {
        await this.deleteFromFirebase(path);
      }
    } catch (error) {
      console.error(`Failed to delete file at path: ${path}`, error);
    }
  }

  static async migrateToAzure() {
    console.log("Starting migration from Firebase to Azure...");

    const firebaseStorageUrl = process.env.FIREBASE_STORAGE_URL;
    if (!firebaseStorageUrl) {
      throw new Error("FIREBASE_STORAGE_URL environment variable is not set.");
    }

    const azureStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!azureStorageConnectionString || azureStorageConnectionString.trim() === "") {
      throw new Error("AZURE_STORAGE_CONNECTION_STRING environment variable is not set.");
    }

    const azureStorageContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    if (!azureStorageContainerName) {
      throw new Error("AZURE_STORAGE_CONTAINER_NAME environment variable is not set.");
    }

    const firebaseBucket = storage.bucket(firebaseStorageUrl);
    const azureBlobServiceClient = BlobServiceClient.fromConnectionString(
      azureStorageConnectionString,
    )

    const fileRepository = getRepository(File);
    const groupAvatarRepository = getRepository(GroupAvatar);
    const avatarRepository = getRepository(Avatar);
    const audioRepository = getRepository(Audio);

    const azureContainerClient = azureBlobServiceClient.getContainerClient(
      azureStorageContainerName,
    );
    try {
      const [files] = await firebaseBucket.getFiles();
      console.log(`Found ${files.length} files to migrate.`);

      for (const file of files) {
        try {
          const exists = await azureContainerClient
            .getBlobClient(file.name)
            .exists();
          if (exists) {
            console.log(`Skipping ${file.name}, already exists in Azure.`);
            continue;
          }

          console.log(`Migrating ${file.name}...`);
          const [buffer] = await file.download();
          const blockBlobClient = azureContainerClient.getBlockBlobClient(
            file.name,
          );
          await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: {
              blobContentType: file.metadata.contentType,
              blobCacheControl: file.metadata.cacheControl,
            },
          });
          console.log(`Migrated ${file.name} successfully.`);

          console.log(`Updating database for ${file.name}...`);
          const newUrl = blockBlobClient.url;
          const path = file.name;

          let updated = false;

          const fileRecord = await fileRepository.findOne({ where: { path } });
          if (fileRecord) {
            await fileRepository.update(fileRecord.id, { url: newUrl });
            console.log(`Updated URL in File table for path ${path}`);
            updated = true;
          }

          const groupAvatarRecord = await groupAvatarRepository.findOne({
            where: { path },
          });
          if (groupAvatarRecord) {
            await groupAvatarRepository.update(groupAvatarRecord.id, {
              url: newUrl,
            });
            console.log(`Updated URL in GroupAvatar table for path ${path}`);
            updated = true;
          }

          const avatarRecord = await avatarRepository.findOne({
            where: { path },
          });
          if (avatarRecord) {
            await avatarRepository.update(avatarRecord.id, { url: newUrl });
            console.log(`Updated URL in Avatar table for path ${path}`);
            updated = true;
          }

          const audioRecord = await audioRepository.findOne({
            where: { path },
          });
          if (audioRecord) {
            await audioRepository.update(audioRecord.id, { url: newUrl });
            console.log(`Updated URL in Audio table for path ${path}`);
            updated = true;
          }

          if (!updated) {
            console.warn(`No database record found for path ${path}`);
          }
        } catch (error) {
          console.error(`Failed to migrate ${file.name}:`, error);
        }
      }
      console.log("Migration completed.");
    } catch (error) {
      console.error("An error occurred during migration:", error);
    }
  }
}

export { StorageManager };
