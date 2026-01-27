import { Request, Response, NextFunction } from 'express';

type AuthPayload = { sub?: number; role?: string };

/** Доступ только для роли admin. Ставится после expressjwt. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as { auth?: AuthPayload }).auth;
  if (auth?.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: admin role required' });
    return;
  }
  next();
}
