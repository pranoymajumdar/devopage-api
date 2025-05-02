import type { ISession } from '@/common/interface/session.interface';
import { tryCatch } from '@/common/utils/try-catch.utils';
import type { User } from '@/modules/users/users.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import type { Response } from 'express';
import * as crypto from 'node:crypto';

@Injectable()
export class SessionService {
  private readonly logger: Logger = new Logger(SessionService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}
  private getSessionData(sessionId: string, user: User): ISession {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = user;
    return {
      id: sessionId,
      user: userData,
    };
  }
  /**
   * Creates a user session
   * @param user - The user to create a session for
   * @param res - The response object
   * @returns True if the session was created successfully, false otherwise
   */
  async createUserSession(user: User, res: Response): Promise<boolean> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const key = `session:${sessionId}`;
    const expiresAt = 60 * 60 * 24 * 1000;

    const cacheResult = await tryCatch(
      this.cacheManager.set<ISession>(
        key,
        this.getSessionData(sessionId, user),
        expiresAt,
      ),
    );

    if (cacheResult.error) {
      this.logger.error('An error occurred while creating a user cache');
      return false;
    }

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      expires: new Date(Date.now() + expiresAt),
      path: '/',
      sameSite: 'none',
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
    });

    return true;
  }

  /**
   * Removes a user session
   * @param sessionId - the id of the session to remove
   * @param res - The response object
   * @returns True if the session was removed successfully, false otherwise
   */
  async removeUserSession(sessionId: string, res: Response): Promise<boolean> {
    const data = await this.cacheManager.get<ISession>(`session:${sessionId}`);
    if (data) {
      await this.cacheManager.del(`session:${sessionId}`);
      res.clearCookie('sessionId', {
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      });
      return true;
    }
    return false;
  }

  /**
   * Invalidates and refreshes a user session
   * @param sessionId - The ID of the session to invalidate
   * @param user - The user associated with the session
   * @returns A promise that resolves when the session is refreshed
   */

  async invalidateUserSession(sessionId: string, user: User): Promise<void> {
    const key = `session:${sessionId}`;
    const data = await this.cacheManager.get<ISession>(key);

    const expiresAt = 60 * 60 * 24 * 1000;
    if (data) {
      await this.cacheManager.del(key);
      await this.cacheManager.set(
        key,
        this.getSessionData(sessionId, user),
        expiresAt,
      );
    }
  }
}
