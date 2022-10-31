import { notificationApi } from "../configs/notificationApi";
import { AxiosResponse } from "axios";
import _ from "lodash";
import { ONESIGNAL_ERROR_TYPE } from "../types/enums";
import { UserNotificationsRepository } from "../repositories/UserNotificationsRepository";
import { getCustomRepository, In } from "typeorm";

type SendNotificationProps = {
  name: string;
  tokens: string[];
  message: NotificationsBody;
  data?: {
    type: string;
    open_in_app?: boolean;
    open_url_on_click?: string;
    [key: string]: any;
  };
  large_icon?: string;
  thread_id?: string; // ONLY IOS
  android_channel_id?: string;
  android_group?: string;
  included_segments?: string[];
  channel_for_external_user_ids?: "push" | "email" | "sms";
};

type NotificationsBody = {
  headings: {
    en: string;
    [key: string]: string;
  };
  contents: {
    en: string;
    [key: string]: string;
  };
};

type NotificationResult =
  | {
      id: string;
      recipients: number;
      external_id: null;
      errors: undefined;
    }
  | {
      id: string;
      recipients: number;
      external_id: null;
      errors: {} | [];
    };

class NotificationsService {
  async send(data: SendNotificationProps) {
    if (!data.tokens.length) return;

    const userNotifications = getCustomRepository(UserNotificationsRepository);
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
            .then(async (res: AxiosResponse<NotificationResult, any>) => {
              console.log(res.data);

              if (res.data.errors) {
                const errors = res.data.errors;

                if (_.isObject(errors) && !_.isArray(errors)) {
                  const errorKeys = Object.keys(errors);

                  await Promise.all(
                    errorKeys.map(async (key) => {
                      if (
                        key === ONESIGNAL_ERROR_TYPE.INVALID_EXTERNAL_USER_IDS
                      ) {
                        console.log("REVOKING ALL INVALID USER IDS");
                        
                        const userIds = errors[key];
                        await userNotifications.update(
                          { user_id: In(userIds) },
                          { is_revoked: true, send_notification: false }
                        );
                      }
                    })
                  );

                  return;
                } else if (_.isArray(errors)) {
                  console.log("OneSignal Create Notification Error");
                  console.log(errors);
                }
              }
            })
            .catch((error) => console.error(error.response.data));
        });
      })
    );
  }
}

export { NotificationsService };
