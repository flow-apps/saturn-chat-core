require("dotenv").config({});
import { Storage } from "@google-cloud/storage";

if (!process.env.FIREBASE_JSON) {
  throw new Error("A variável de ambiente FIREBASE_JSON não está definida.");
}

const firebaseConfig = JSON.parse(process.env.FIREBASE_JSON);

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: firebaseConfig,
});

export { storage };
