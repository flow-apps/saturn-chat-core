import { FirebaseAdmin } from "./firebase";

interface IRemoteConfigs {
  premium_max_groups: string;
  ad_multiple_in_chat: string;
  premium_max_participants: string;
  premium_file_upload: string;
  default_max_participants: string;
  premium_max_message_length: string;
  api_url: string;
  default_file_upload: string;
  default_max_groups: string;
  default_max_message_length: string;
}

const remoteConfigsPromised = FirebaseAdmin.remoteConfig()
  .getTemplate()
  .then((configs: any) => {
    let mappedConfigs = {};
    const configKeys = Object.keys(configs.parameters);

    configKeys.map((key) => {
      return (mappedConfigs[key] = configs.parameters[key].defaultValue
        .value as any);
    });

    return mappedConfigs as any;
  })
  .catch(error => {
    console.log("[ Remote Configs ] Não foi possível carregar as Remote Configs, usaremos as Fallback Configs")
  })

// Fallback values
let remoteConfigs: IRemoteConfigs = {
  ad_multiple_in_home: "4",
  premium_max_groups: "10",
  ad_multiple_in_chat: "7",
  premium_max_participants: "1000",
  premium_file_upload: "120",
  default_max_participants: "200",
  premium_max_message_length: "5000",
  api_url: "https://saturnchat.azurewebsites.net/",
  default_file_upload: "12",
  default_max_groups: "5",
  default_max_message_length: "1500",
} as IRemoteConfigs;

remoteConfigsPromised.then((configs) => {
  remoteConfigs = configs;
});

export { remoteConfigs };
