import type { PublicUser } from '@/common/database/schemas/users.schema';
import type { IApiResponse } from '@/common/interface/response.interface';
import { generateSalt, hashPassword } from '@/common/utils/crypto.utils';
import { tryCatch } from '@/common/utils/try-catch.utils';
import { UsersService } from '@/modules/users/users.service';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { SignUpDto } from '../dtos/sign-up.dto';
import { SessionService } from './session.service';
import { EmailService } from './email.service';

@Injectable()
export class SignUpService {
  private readonly logger = new Logger(SignUpService.name);
  constructor(
    private readonly sessionService: SessionService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Handles user registration process
   * @param dto User registration data
   */
  async signUp(
    dto: SignUpDto,
    res: Response,
  ): Promise<IApiResponse<PublicUser>> {
    const emailResult = await tryCatch(
      this.usersService.findUserBy('email', dto.email),
    );

    if (emailResult.error) {
      this.logger.error(
        `Error checking email availability: ${emailResult.error.message}`,
        emailResult.error.stack,
      );

      throw new InternalServerErrorException(
        `We're having trouble processing your sign up. Please try again later.`,
        { cause: emailResult.error },
      );
    }
    // Check if the email is already registered
    if (emailResult.data) {
      throw new ConflictException('This email is already registered.');
    }

    const usernameResult = await tryCatch(
      this.usersService.findUserBy('username', dto.username),
    );

    if (usernameResult.error) {
      this.logger.error(
        `Error checking username availability: ${usernameResult.error.message}`,
        usernameResult.error.stack,
      );

      throw new InternalServerErrorException(
        `We're having trouble processing your sign up. Please try again later.`,
        { cause: usernameResult.error },
      );
    }

    // Check if the username is already taken
    if (usernameResult.data) {
      throw new ConflictException('This username is already taken.');
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

    // Create a session for the user
    await this.sessionService.createUserSession(createUserResult.data, res);

    // Send a verification email
    void this.emailService.sendEmailVerification(createUserResult.data);
    return {
      success: true,
      message:
        'Sign up successful. Please check your email to verify your account.',
      data: this.usersService.sanitizeUser(createUserResult.data),
    };
  }
}
