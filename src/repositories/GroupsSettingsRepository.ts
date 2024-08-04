import { EntityRepository, In, Repository } from "typeorm";
import { GroupSettings } from "../entities/GroupSetting";
import { defaultGroupSettings } from "../configs/defaults/group.settings";
import _ from "lodash";

interface IUpdateSettings {
  setting_name: string;
  setting_value: any;
}
@EntityRepository(GroupSettings)
class GroupsSettingsRepository extends Repository<GroupSettings> {
  async getOrGenerateSettings(group_id: string) {
    const hasGroupSettings = await this.findOne({ where: { group_id } });

    if (hasGroupSettings) {
      return hasGroupSettings;
    }

    const newSettings = await Promise.all(
      Object.keys(defaultGroupSettings).map(async (configKey) => {
        const createdSettings = this.create({
          setting_name: configKey,
          setting_value: String(defaultGroupSettings[configKey]),
          typeof_value: typeof defaultGroupSettings[configKey],
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
