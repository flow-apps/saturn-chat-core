import { NextFunction, Request, Response } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../configs/redis";

const rateLimiter = new RateLimiterRedis({
  points: 15,
  duration: 60,
  blockDuration: 600,
  storeClient: redisClient,
  keyPrefix: "rate_limiter",
});

async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const nodeEnv = process.env.NODE_ENV;

  console.log("[Rate Limiter] processando Rate Limiter");

  if (["test", "development"].includes(nodeEnv)) {
    return _next();
  }

  rateLimiter
    .consume(req.ip)
    .then(() => _next())
    .catch(() => {
      res.status(429).json({ message: "Too many request!" });
    });
}

export { rateLimiterMiddleware };
