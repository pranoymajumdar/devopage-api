import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import type { Request } from 'express';
import { tryCatch } from '../utils/try-catch.utils';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * This method checks if the user is authenticated by verifying the session ID in the request cookies.
   * If the session ID is valid, it retrieves the session data from the cache and attaches it to the request object.
   * @param context The execution context
   * @returns A boolean indicating whether the user is authenticated or not
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sessionId = req.cookies?.['session-id'] as string | undefined;
    if (!sessionId) {
      throw new UnauthorizedException();
    }
    const result = await tryCatch(
      this.cacheManager.get(`session:${sessionId}`),
    );
    if (result.error) {
      this.logger.error('Error fetching session data', result.error);
      throw new UnauthorizedException();
    }
    if (!result.data) {
      throw new UnauthorizedException();
    }

    // Attach user/session info to request for later use in controllers
    req['session'] = result.data;

    return true;
  }
}
