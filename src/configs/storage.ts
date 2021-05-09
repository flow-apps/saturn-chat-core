require("dotenv").config({});
import { Storage } from "@google-cloud/storage";
import path from "path";

const storage = new Storage({
  projectId: "flow-chat-240c5",
  keyFilename: path.join(__dirname, "..", process.env.FIREBASE_KEY_FILENAME),
});

export { storage };
