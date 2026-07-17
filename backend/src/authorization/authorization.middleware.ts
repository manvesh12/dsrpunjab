import type { NextFunction, Request, Response } from "express";


export function requireAnyRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) { res.status(403).json({ error: "Access denied" }); return; }
    next();
  };
}
