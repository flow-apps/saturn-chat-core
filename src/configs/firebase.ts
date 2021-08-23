import FirebaseAdmin from "firebase-admin";
import path from "path";

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(
    require(path.join(__dirname, "..", "firebase-key.json"))
  ),
});

export { FirebaseAdmin }
