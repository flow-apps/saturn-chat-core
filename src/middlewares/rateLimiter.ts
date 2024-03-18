import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { AppError } from "../errors/AppError";

const rateLimiter = new RateLimiterMemory({
  points: 15,
  duration: 60,
  blockDuration: 600,
  keyPrefix: "rate_limiter"
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
    .catch((error) => {
      res.status(429).json({ message: "Too many requests" })
    });
}

export { rateLimiterMiddleware };
