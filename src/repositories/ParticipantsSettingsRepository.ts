import { EntityRepository, In, Repository } from "typeorm";
import _ from "lodash";
import { defaultParticipantSettings } from "../configs/defaults/participant.settings";
import { ParticipantSetting } from "../entities/ParticipantSetting";

interface IUpdateSettings {
  setting_name: string;
  setting_value: any;
}

type TSettingNameKeys = keyof typeof defaultParticipantSettings;

@EntityRepository(ParticipantSetting)
class ParticipantsSettingsRepository extends Repository<ParticipantSetting> {
  async getOrGenerateSettings(participant_id: string) {
    const defaultConfigsKeys = Object.keys(defaultParticipantSettings);
    const hasParticipantSettings = await this.find({
      where: { participant_id },
    });

    if (hasParticipantSettings) {
      const participantSettingsKeys = hasParticipantSettings.map(
        (setting) => setting.setting_name
      );

      if (_.isEqual(participantSettingsKeys, defaultConfigsKeys)) {
        return hasParticipantSettings;
      } else {
        const diferrentSettingKeys = defaultConfigsKeys.filter(
          (dc) => !participantSettingsKeys.includes(dc)
        );

        await Promise.all(
          diferrentSettingKeys.map(async (newKey) => {
            const newSetting = this.create({
              setting_name: newKey,
              setting_value: defaultParticipantSettings[newKey].value,
              input_type: defaultParticipantSettings[newKey].input_type,
              typeof_value: typeof defaultParticipantSettings[newKey].value,
              participant_id,
            });

            await this.save(newSetting);
            return newSetting;
          })
        );

        const savedSettings = await this.find({ where: { participant_id } });

        return _.sortBy(savedSettings, (o) => o.setting_name);
      }
    }

    const newSettings = await Promise.all(
      defaultConfigsKeys.map(async (configKey) => {
        const createdSettings = this.create({
          setting_name: configKey,
          setting_value: String(defaultParticipantSettings[configKey].value),
          typeof_value: typeof defaultParticipantSettings[configKey].value,
          input_type: typeof defaultParticipantSettings[configKey].input_type,
          participant_id,
        });

        await this.save(createdSettings);
        return createdSettings;
      })
    );

    return _.sortBy(newSettings, (o) => o.setting_name);
  }

  async getOneSetting(participant_id: string, setting_name: TSettingNameKeys) {
    if (!participant_id || !setting_name) return undefined;

    const setting = this.findOne({ where: { participant_id, setting_name } });

    return setting;
  }

  async updateSettings(participant_id: string, settings: IUpdateSettings[]) {
    const newSettingsKeys = settings
      .map((setting) => setting.setting_name)
      .sort();
    const permittedSettingsNames = Object.keys(
      defaultParticipantSettings
    ).sort();
    const isPermitted = _.isEqual(newSettingsKeys, permittedSettingsNames);

    if (!isPermitted) throw new Error("Invalid setting name");

    const oldSettings = await this.find({
      participant_id,
      setting_name: In(newSettingsKeys),
    });

    settings.map((newSetting) => {
      let oldSettingIndex = _.findIndex(oldSettings, {
        setting_name: newSetting.setting_name,
      });
      oldSettings[oldSettingIndex].setting_value = newSetting.setting_value;
    });

    await this.save(oldSettings);
    return _.sortBy(oldSettings, (o) => o.setting_name);
  }
}

export { ParticipantsSettingsRepository };
