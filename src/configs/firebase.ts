import "dotenv/config";
import FirebaseAdmin from "firebase-admin";

const json = process.env.FIREBASE_JSON;

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(json),
});

export { FirebaseAdmin };
