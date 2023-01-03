import "dotenv/config"
import FirebaseAdmin from "firebase-admin";
import path from "path";

const firebaseKeyPath = process.env.FIREBASE_KEY_FILE_PATH || path.join(__dirname, "..", "firebase-key.json")

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(
    require(firebaseKeyPath),
  ),
});

export { FirebaseAdmin }
