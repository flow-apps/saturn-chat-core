import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import jwt from "jsonwebtoken";

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

  const tokenParts = authHeader.split(" ");

  if (tokenParts.length !== 2) {
    throw new AppError("Token error");
  }

  const [schema, token] = tokenParts;

  if (schema !== "Bearer") {
    throw new AppError("Invalid type token");
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded: any) => {
    if (err) throw new AppError("Token invalid");

    req.userId = decoded.id;
    return _next();
  });
}

export { authProvider };
