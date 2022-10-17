import { notificationApi } from "../configs/notificationApi";
import _ from "lodash";
import { AxiosResponse } from "axios";

type SendNotificationProps = {
  name: string;
  tokens: string[];
  message: NotificationsBody;
  url_on_click?: string;
  data?: object;
  ttl?: number;
  large_icon?: string;
  android_channel_id?: string;
  android_group?: string;
  thread_id?: string;
  included_segments?: string[];
  channel_for_external_user_ids?: "push" | "email" | "sms";
};

type NotificationsBody = {
  headings: {
    [key: string]: string;
  };
  contents: {
    [key: string]: string;
  };
};

type NotificationResult = {
  id: string;
  recipients: number;
  external_id: null;
} | {
  id: string;
  recipients: number;
  external_id: null;
  errors: any;
}

class NotificationsService {
  async send(data: SendNotificationProps) {

    if (!data.tokens.length)
      return;

    const chunkedTokens = _.chunk(data.tokens, 2000);
    const chunkedRequests = _.chunk(
      chunkedTokens.map((tokens) => {
        return {
          name: data.name,
          app_id: process.env.ONESIGNAL_APP_ID,
          data: data.data,
          included_segments: data.included_segments || [],
          include_external_user_ids: tokens,
          headings: data.message.headings,
          contents: data.message.contents,
          large_icon: data.large_icon || "",
          android_group: data.android_group || "",
          android_channel_id: data.android_channel_id,
          channel_for_external_user_ids:
            data.channel_for_external_user_ids || "push",
        };
      }),
      150
    );

    await Promise.all(
      chunkedRequests.map((requests) => {
        requests.map((req) => {
          notificationApi
            .post("/notifications", req)
            .then((res: AxiosResponse<NotificationResult, any>) => {
              console.log(res.data);
            })
            .catch((error) => console.error(error.response.data));
        });
      })
    );
  }
}

export { NotificationsService };
