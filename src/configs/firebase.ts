import "dotenv/config";
import FirebaseAdmin from "firebase-admin";

if (!process.env.FIREBASE_JSON) {
  throw new Error("A variável de ambiente FIREBASE_JSON não está definida.");
}

const firebaseConfig = JSON.parse(process.env.FIREBASE_JSON);

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(firebaseConfig),
});

export { FirebaseAdmin };
