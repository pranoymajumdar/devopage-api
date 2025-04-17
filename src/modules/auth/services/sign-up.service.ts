import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { SignUpDto } from '../dtos/sign-up.dto';
import { SessionService } from './session.service';
import { UsersService } from '@/modules/users/users.service';
import { tryCatch } from '@/common/utils/try-cache.utils';
import { generateSalt, hashPassword } from '@/common/utils/crypto.utils';
import type { IApiResponse } from '@/common/interface/response.interface';
import type { PublicUser } from '@/common/database/schemas/users.schema';

@Injectable()
export class SignUpService {
  private readonly logger = new Logger(SignUpService.name);
  constructor(
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handles user registration process
   * @param dto User registration data
   */
  async signUp(dto: SignUpDto): Promise<IApiResponse<PublicUser>> {
    const emailResult = await tryCatch(
      this.usersService.findUserBy('email', dto.email),
    );

    if (emailResult.error) {
      this.handleLookupError('email', emailResult.error);
    }
    if (emailResult.data) {
      this.logger.debug(`Email ${dto.email} is already in use`);
      throw new ConflictException(
        'This email is already registered. Please use a different email address.',
      );
    }

    // Check if username already exists
    const usernameResult = await tryCatch(
      this.usersService.findUserBy('username', dto.username),
    );

    if (usernameResult.error) {
      this.handleLookupError('username', usernameResult.error);
    }

    if (usernameResult.data) {
      this.logger.debug(`Username ${dto.username} is already taken`);
      throw new ConflictException(
        'This username is already taken. Please choose a different username.',
      );
    }

    const salt = generateSalt();
    const hashedInputPassword = await hashPassword(dto.password, salt);
    const createUserResult = await tryCatch(
      this.usersService.createUser({
        ...dto,
        salt: salt,
        password: hashedInputPassword,
      }),
    );
    if (createUserResult.error) {
      this.logger.error(
        `Failed to create user: ${createUserResult.error.message}`,
        createUserResult.error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while creating the user. Please try again later or contact support.',
      );
    }

    this.logger.log(
      `Successfully created user account for ${dto.username} (ID: ${createUserResult.data.id})`,
    );

    // TODO: Email verification link
    return {
      success: true,
      message: 'Sign up successful',
      data: this.usersService.sanitizeUser(createUserResult.data),
    };
  }
  /**
   * Handles errors that occur during user lookup
   * @param field The field that caused the error (e.g., email, username)
   * @param error The error that occurred
   */
  private handleLookupError(field: string, error: Error): never {
    this.logger.error(
      `Error checking ${field} availability: ${error.message}`,
      error.stack,
    );

    throw new InternalServerErrorException(
      `Failed to verify ${field} availability. Please try again later.`,
      { cause: error },
    );
  }
}
