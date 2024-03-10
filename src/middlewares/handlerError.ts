import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

function handlerError(
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      reason: err.reason
    });
  }

  console.error(err);
  return res.status(500).json({
    message: `Internal server error.`,
    reason: err.message
  });
}

export { handlerError };
