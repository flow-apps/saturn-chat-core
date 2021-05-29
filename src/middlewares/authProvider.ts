import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import jwt from "jsonwebtoken";
import { validateJWT } from "../utils/validateJwt";

export interface RequestAuthenticated extends Request {
  userId: string;
}

function authProvider(
  req: RequestAuthenticated,
  res: Response,
  _next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("No token provided");
  }

  return validateJWT(authHeader, (err, decoded: any) => {
    if (err) throw new AppError("Token invalid");

    req.userId = decoded.id;
    return _next();
  });
}

export { authProvider };
