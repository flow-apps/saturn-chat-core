import { NextFunction, Request, Response } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../configs/redis";

const rateLimiter = new RateLimiterRedis({
  points: 30,
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

  console.log("[Rate Limiter] processando Rate Limiter");
  

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
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
