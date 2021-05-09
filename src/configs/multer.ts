import multer, { Options } from "multer";

function configMulter(limitFileSize = 5, allowedMimeTypes?: string[]): Options {
  return {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: limitFileSize * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const allowed = allowedMimeTypes.length
        ? allowedMimeTypes
        : ["image/jpeg", "image/pjpeg", "image/webp", "image/png", "image/jpg"];

      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type."));
      }
    },
  } as Options;
}

export { configMulter };
