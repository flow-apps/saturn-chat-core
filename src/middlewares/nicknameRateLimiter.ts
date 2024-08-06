import { NextFunction, Request, Response } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { cache } from "../configs/cache";

const rateLimiter = new RateLimiterRedis({
  storeClient: cache,
  points: 5,
  duration: 15,
  blockDuration: 30,
  keyPrefix: "rate_limiter",
});

async function nicknameRateLimiterMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const nodeEnv = process.env.NODE_ENV;
  
  if (["test", "development"].includes(nodeEnv)) {
    return _next();
  }

  rateLimiter
    .consume(req.ip)
    .then(async () => {
      await rateLimiter.delete(req.ip);
      return _next();
    })
    .catch((error) => {
      return res.status(429).json({ message: "Too many requests" });
    });
}

export { nicknameRateLimiterMiddleware };
