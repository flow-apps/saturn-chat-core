import { NextFunction, Response } from "express";
import { RequestAuthenticated } from "./authProvider";
import { SubscriptionsService } from "../services/SubscriptionsService";

export interface RequestPremium extends RequestAuthenticated {
  isPremium: boolean;
}

export const validatePremium = async (
  req: RequestPremium,
  res: Response,
  _next: NextFunction
) => {
  console.log("AQUUUi");
  
  const subscriptionsService = new SubscriptionsService();
  const subscription = await subscriptionsService.get(req.userId, true, false);

  if (!subscription) {
    req.isPremium = false;
    _next();
  }

  const isPremium = await subscriptionsService.isActive(subscription);

  req.isPremium = isPremium;
  _next();
};
