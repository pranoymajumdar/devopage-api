import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SelectUser } from '@/common/database/schemas/users.schema';
import * as crypto from 'node:crypto';
import { ISessionData } from '../interface/session.interface';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { tryCatch } from '@/common/utils/try-catch.utils';

const SESSION_EXPIRY = 86400; // 24 hours

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly config: ConfigService,
  ) {}

  async createUserSession(
    user: SelectUser,
    res: Response,
  ): Promise<ISessionData> {
    const sessionId = crypto.randomBytes(46).toString('hex').normalize();

    const key = `session:${sessionId}`;
    const ttlMilliseconds = SESSION_EXPIRY * 1000;
    const result = await this.cacheManager.set<ISessionData>(
      key,
      {
        userId: user.id,
        userRole: user.role,
      },
      ttlMilliseconds,
    );

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + SESSION_EXPIRY);
    res.cookie('session-id', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.getOrThrow('NODE_ENV') === 'production',
      path: '/',
      expires: expiryDate,
    });

    return result;
  }

  async deleteUserSession(sessionId: string, res: Response) {
    const deleteResult = await tryCatch(
      this.cacheManager.del(`session:${sessionId}`),
    );
    if (deleteResult.error) {
      this.logger.error('Error deleting session', deleteResult.error);
      return false;
    }

    res.clearCookie('session-id', {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.getOrThrow('NODE_ENV') === 'production',
    });

    return true;
  }
}
