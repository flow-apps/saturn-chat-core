import { Response } from "express";
import { RequestAuthenticated } from "../middlewares/authProvider";
import { subcriptionsAPI } from "../configs/playStoreService";

class SubscriptionsController {
  async get(req: RequestAuthenticated, res: Response) {
    const { subscription_id, purchase_token } = req.body;
    
    console.log(req.body);
    

    const subscription = await subcriptionsAPI.acknowledge({
      packageName: "com.flowapps.saturnchat",
      subscriptionId: subscription_id,
      token: purchase_token,
    });

    console.log(subscription.data);
    

    res.sendStatus(200);
  }
}

export { SubscriptionsController };
