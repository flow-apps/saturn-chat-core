import { Request, Response } from "express";
import { FirebaseAdmin } from "../configs/firebase";

class AppController {
  async getConfigs(req: Request, res: Response) {
    const { type } = req.query;
    const remoteConfigs = FirebaseAdmin.remoteConfig();
    const parameters = (await remoteConfigs.getTemplate()).parameters as {
      [key: string]: { defaultValue: { value: string } };
    };
    const keys = Object.keys(parameters);
    let configs = {} as { [key: string]: string };
    keys.map((key) => {
      return (configs[key] = parameters[key].defaultValue["value"]);
    });

    switch (type) {
      case "premium":
        const premiumKeys = keys.filter((key) => key.match("premium"));
        const premiumConfigs = {};

        premiumKeys.map((PK) => (premiumConfigs[PK] = configs[PK]));

        return res.json(premiumConfigs);

      case "default":
        const defaultKeys = keys.filter((key) => key.match("default"));
        const defaultConfigs = {};

        defaultKeys.map((DK) => (defaultConfigs[DK] = configs[DK]));

        return res.json(defaultConfigs);

      default:
        return res.json(configs);
    }
  }
}

export { AppController };
