require("dotenv").config({});
import { Storage } from "@google-cloud/storage";
import firebaseJsonKey from "../../firebase-key.json"

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: firebaseJsonKey,
});

export { storage };
