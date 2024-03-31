import "dotenv/config"
import FirebaseAdmin from "firebase-admin";
import path from "path";

const firebaseKeyPath = path.join(__dirname, "..", "firebase-key.json")

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(
    require(firebaseKeyPath),
  ),
});

export { FirebaseAdmin, firebaseKeyPath }
