export enum PaymentState {
  PENDENT = 0,
  RECEIVED = 1,
  TEST = 2,
  UPGRADE = 3,
}

export enum PurchaseType {
  TEST = 0,
  PROMOTION = 1,
  NONE = 999
}

export enum CancelReasonType {
  SYSTEM = 0,
  USER = 1,
  REPLACE = 2,
  DEVELOPER = 3
}

export enum SubscriptionPeriod {
  MONTHLY = 0,
  QUARTERLY = 1,
  YEARLY = 2
}
