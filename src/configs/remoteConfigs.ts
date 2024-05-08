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

    console.log("[Remote Configs] Configurações carregadas:", mappedConfigs);

    return mappedConfigs as any;
  });

let remoteConfigs: IRemoteConfigs = {} as IRemoteConfigs;

remoteConfigsPromised.then((configs) => {
  remoteConfigs = configs;
});

export { remoteConfigs };
