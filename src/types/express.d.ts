import type { JwtPayload } from '@modules/auth/types/jwt-payload';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
