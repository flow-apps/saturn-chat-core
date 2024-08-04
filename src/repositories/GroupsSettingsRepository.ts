import { EntityRepository, Repository } from "typeorm";
import { GroupSettings } from "../entities/GroupSetting";
import { defaultGroupSettings } from "../configs/defaults/group.settings";

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
          setting_value: defaultGroupSettings[configKey],
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
}

export { GroupsSettingsRepository };
