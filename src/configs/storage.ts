require("dotenv").config({});
import { Storage } from "@google-cloud/storage";
import path from "path";

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: path.join(__dirname, "..", process.env.FIREBASE_KEY_FILENAME),
});

export { storage };
