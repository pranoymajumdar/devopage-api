import type { PublicUser } from '@/common/database/schemas/users.schema';
import type { IApiResponse } from '@/common/interface/response.interface';
import { comparePasswords } from '@/common/utils/crypto.utils';
import { tryCatch } from '@/common/utils/try-catch.utils';
import { UsersService } from '@/modules/users/users.service';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { SignInDto } from '../dtos/sign-in.dto';
import { SessionService } from './session.service';

@Injectable()
export class SignInService {
  private readonly logger = new Logger(SignInService.name);
  constructor(
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handles user sign-in process
   * @param dto User sign-in data
   * @param res Express response object
   */
  async signIn(
    dto: SignInDto,
    res: Response,
  ): Promise<IApiResponse<PublicUser>> {
    this.logger.debug(`Attempting to sign in user with email: ${dto.email}`);

    const userResult = await tryCatch(
      this.usersService.findUserBy('email', dto.email),
    );

    if (userResult.error) {
      this.logger.error(
        `Error finding user by email: ${dto.email}`,
        userResult.error,
      );
      throw new InternalServerErrorException(
        'An error occurred during the process',
      );
    }

    if (!userResult.data) {
      this.logger.debug(`User with email ${dto.email} not found`);
      throw new UnauthorizedException(
        'Invalid email or password. Please try again.',
      );
    }

    const comparePasswordResult = await tryCatch(
      comparePasswords(
        dto.password,
        userResult.data.password,
        userResult.data.salt,
      ),
    );
    if (comparePasswordResult.error) {
      this.logger.error(
        `Error comparing passwords for user ${userResult.data.email}`,
        comparePasswordResult.error,
      );
      throw new InternalServerErrorException();
    }

    if (!comparePasswordResult.data) {
      this.logger.debug(`Invalid password for user ${userResult.data.email}`);
      throw new UnauthorizedException(
        'Invalid email or password. Please try again.',
      );
    }

    const sessionData = await tryCatch(
      this.sessionService.createUserSession(userResult.data, res),
    );

    if (sessionData.error) {
      this.logger.error(
        `Error creating session for user ${userResult.data.email}`,
        sessionData.error,
      );
      throw new InternalServerErrorException();
    }

    if (!sessionData.data) {
      this.logger.debug(
        `Failed to create session for user ${userResult.data.email}`,
      );
      throw new InternalServerErrorException(
        'An error occurred while creating the session. Please try again later.',
      );
    }

    return {
      success: true,
      message: 'User signed in successfully',
      data: this.usersService.sanitizeUser(userResult.data),
    };
  }
}
