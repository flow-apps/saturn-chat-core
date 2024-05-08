import "dotenv/config";
import FirebaseAdmin from "firebase-admin";
import path from "path";

const firebaseKeyPath = path.join(__dirname, "..", "firebase-key.json");

FirebaseAdmin.initializeApp({
  credential: FirebaseAdmin.credential.cert(require(firebaseKeyPath)),
});

const remoteConfigs = FirebaseAdmin.remoteConfig()
  .getTemplate()
  .then((configs) => {
    let mappedConfigs = {};
    const configKeys = Object.keys(configs.parameters);

    configKeys.map((key) => {
      return (mappedConfigs[key] = configs.parameters[key].defaultValue
        .value as any);
    });

    console.log(mappedConfigs);

    return mappedConfigs;
  });

export { FirebaseAdmin, firebaseKeyPath, remoteConfigs };
