import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request, Response } from 'express';
import { ISession } from '../interface/session.interface';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  async use(req: Request, res: Response, next: (error?: unknown) => void) {
    const sessionId = req.cookies.sessionId as string | undefined;

    if (!sessionId) {
      return next();
    }
    const data = await this.cacheManager.get<ISession>(`session:${sessionId}`);

    if (!data) {
      return next();
    }
    req.session = data;
    return next();
  }
}
