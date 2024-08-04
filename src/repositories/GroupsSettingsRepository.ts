import { EntityRepository, In, Repository } from "typeorm";
import { GroupSetting } from "../entities/GroupSetting";
import { defaultGroupSettings } from "../configs/defaults/group.settings";
import _ from "lodash";

interface IUpdateSettings {
  setting_name: string;
  setting_value: any;
}
@EntityRepository(GroupSetting)
class GroupsSettingsRepository extends Repository<GroupSetting> {
  async getOrGenerateSettings(group_id: string) {
    const defaultConfigsKeys = Object.keys(defaultGroupSettings);
    const hasGroupSettings = await this.find({ where: { group_id } });

    if (hasGroupSettings) {
      const groupSettingsKeys = hasGroupSettings.map(
        (setting) => setting.setting_name
      );

      if (_.isEqual(groupSettingsKeys, defaultConfigsKeys)) {
        return hasGroupSettings;
      } else {
        const diferrentSettingKeys = defaultConfigsKeys.filter(
          (dc) => !groupSettingsKeys.includes(dc)
        );

        await Promise.all(
          diferrentSettingKeys.map(async (newKey) => {
            const newSetting = this.create({
              setting_name: newKey,
              setting_value: defaultGroupSettings[newKey].value,
              input_type: defaultGroupSettings[newKey].input_type,
              typeof_value: typeof defaultGroupSettings[newKey].value,
              group_id,
            });

            await this.save(newSetting);
            return newSetting;
          })
        );

        const savedSettings = await this.find({ where: { group_id } });

        return savedSettings;
      }
    }

    const newSettings = await Promise.all(
      defaultConfigsKeys.map(async (configKey) => {
        const createdSettings = this.create({
          setting_name: configKey,
          setting_value: String(defaultGroupSettings[configKey].value),
          typeof_value: typeof defaultGroupSettings[configKey].value,
          input_type: typeof defaultGroupSettings[configKey].input_type,
          group_id,
        });

        await this.save(createdSettings);
        return createdSettings;
      })
    );

    return newSettings;
  }

  async getOneSetting(group_id: string, setting_name: string) {
    if (!group_id || !setting_name) return undefined;

    const setting = this.findOne({ where: { group_id, setting_name } });

    return setting;
  }

  async updateSettings(group_id: string, settings: IUpdateSettings[]) {
    const newSettingsKeys = settings.map((setting) => setting.setting_name);
    const permittedSettingsNames = Object.keys(defaultGroupSettings);
    const isPermitted = _.isEqual(newSettingsKeys, permittedSettingsNames);

    if (!isPermitted) throw new Error("Invalid setting name");

    const oldSettings = await this.find({
      group_id,
      setting_name: In(newSettingsKeys),
    });

    const newSettings = oldSettings.map((oldSetting) => {
      settings.map(async (newSetting) => {
        oldSetting[newSetting.setting_name] = String(newSetting.setting_value);
      });
      return oldSetting;
    });

    await this.save(newSettings);
    return newSettings;
  }
}

export { GroupsSettingsRepository };
