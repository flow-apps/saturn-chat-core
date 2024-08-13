require("dotenv").config({});
import { Storage } from "@google-cloud/storage";
import { JWTInput } from "google-auth-library";

const firebaseJsonKey = process.env.FIREBASE_JSON as JWTInput

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: firebaseJsonKey,
});

export { storage };
