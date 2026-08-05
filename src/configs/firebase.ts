import "dotenv/config";
import FirebaseAdmin from "firebase-admin";
import firebaseJson from "../../firebase-key.json"

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(firebaseJson as any),
});

export { FirebaseAdmin };
