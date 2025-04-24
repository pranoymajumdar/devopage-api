import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { ISession } from '@/common/interface/session.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies.sessionId as string | undefined;

    if (!sessionId) {
      throw new UnauthorizedException();
    }
    const data = await this.cacheManager.get<ISession>(`session:${sessionId}`);

    if (!data) {
      throw new UnauthorizedException();
    }
    request.session = data;
    return true;
  }
}
