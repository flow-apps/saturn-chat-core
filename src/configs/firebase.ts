import FirebaseAdmin from "firebase-admin";
import path from "path";

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(
    require(process.env.FIREBASE_KEY_FILE_PATH || path.join(__dirname, "..", "firebase-key.json"))
  ),
});

export { FirebaseAdmin }
