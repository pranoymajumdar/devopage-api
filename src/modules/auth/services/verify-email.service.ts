import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { VerifyEmailDto } from '../dtos/verify-email.dto';
import { IApiResponse } from '@/common/interface/response.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { tryCatch } from '@/common/utils/try-catch.utils';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { DATABASE_CONNECTION } from '@/common/database/database.connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { usersTable } from '@/common/database/schemas/users.schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class VerifyEmailService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase,
    private readonly config: ConfigService,
  ) {}

  async verifyEmail(dto: VerifyEmailDto): Promise<IApiResponse<null>> {
    // Hash the token using HMAC with SHA-256
    const hashedToken = createHmac(
      'sha256',
      this.config.getOrThrow('VERIFICATION_TOKEN_SECRET'),
    )
      .update(dto.token)
      .digest('hex');

    const key = `email-verification:${hashedToken}`;
    // Retrieve the user ID from the cache
    const result = await tryCatch(this.cacheManager.get<string>(key));

    if (result.error) {
      throw new InternalServerErrorException(
        'An unexpected error occured while verifying your email. Please try again later.',
      );
    }

    if (!result.data) {
      throw new BadRequestException('Invalid or expired verification token.');
    }
    // Check if the user ID is valid
    const userIdResult = await tryCatch(
      this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, result.data))
        .limit(1),
    );

    if (userIdResult.error) {
      throw new InternalServerErrorException(
        'An unexpected error occured while verifying your email. Please try again later.',
        { cause: userIdResult.error },
      );
    }
    if (userIdResult.data.length === 0) {
      await this.cacheManager.del(key);
      throw new BadRequestException('Invalid or expired verification token.');
    }
    // Check if the email is already verified
    if (userIdResult.data[0].isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }
    // Update the user's email verification status
    await this.db
      .update(usersTable)
      .set({
        isEmailVerified: true,
      })
      .where(eq(usersTable.id, result.data));
    await this.cacheManager.del(key);

    return {
      success: true,
      message: 'Email verified successfully.',
      data: null,
    };
  }
}
