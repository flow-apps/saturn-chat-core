import axios from "axios";

const notificationApi = axios.create({
  baseURL: "https://onesignal.com/api/v1",
  headers: {
    Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
    "content-type": "application/json",
    accept: "application/json",
  },
});

export { notificationApi };
