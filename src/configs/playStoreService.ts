import { JWT } from "google-auth-library";
import { google } from "googleapis";

google.options({
  auth: new JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/androidpublisher"],
  )
});

const playStoreService = google.androidpublisher("v3");
const subcriptionsAPI = playStoreService.purchases.subscriptions

export { playStoreService, subcriptionsAPI };
