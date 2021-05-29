import { AppError } from "../errors/AppError";
import jwt from "jsonwebtoken";

function validateJWT(authText: string, callback: jwt.VerifyCallback) {
  const tokenParts = authText.split(" ");

  if (tokenParts.length !== 2) {
    throw new AppError("Token error");
  }

  const [schema, token] = tokenParts;

  if (schema !== "Bearer") {
    throw new AppError("Invalid type token");
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, callback);
}

export { validateJWT };
