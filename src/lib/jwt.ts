import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/** Подписывает JWT access token для переданного payload (sub, email, role). */
export function signAccessToken(payload: object): string {
  return jwt.sign(
    payload,
    env.JWT_SECRET as jwt.Secret,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      audience: env.JWT_AUDIENCE,
      issuer: env.JWT_ISSUER,
    }
  );
}
