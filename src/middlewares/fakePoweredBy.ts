import { NextFunction, Request, Response } from "express";

function fakePoweredBy(req: Request, res: Response, _next: NextFunction) {
  res.set("X-Powered-By", "PHP/5.4.37");
  _next();
}

export { fakePoweredBy };
