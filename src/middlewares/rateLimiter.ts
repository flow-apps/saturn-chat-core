import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  blockDuration: 600,
});

async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
) {
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
