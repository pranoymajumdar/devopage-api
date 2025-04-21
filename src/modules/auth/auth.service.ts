import { ApiResponse } from '@/common/interface/response.interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { SafeUser } from '../users/users.entity';
import { UsersService } from '../users/users.service';
import {
  SignUpDto,
  SignInDto,
  ForgotPasswordDto,
  VerifyEmailDto,
} from './dtos';
import { EmailService } from '../email/email.service';
import { SessionService } from './session/session.service';
import type { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Sign up a new user
   * @param dto - containing user details
   * @param res - the response object
   * @returns ApiResponse with the created user
   */
  async signUp(dto: SignUpDto, res: Response): Promise<ApiResponse<SafeUser>> {
    const user = await this.usersService.create(dto);
    void this.emailService.sendVerificationEmail(user);
    await this.sessionService.createUserSession(user, res);
    return {
      status: true,
      message: 'Sign up successful',
      data: user.sanitize(),
    };
  }

  /**
   * Sign in a user
   * @param dto - containing user details
   * @param res - the response object
   * @returns ApiResponse with the signed-in user
   */
  async signIn(dto: SignInDto, res: Response): Promise<ApiResponse<SafeUser>> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isValidPassword = await user.validatePassword(dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.sessionService.createUserSession(user, res);
    return {
      status: true,
      message: 'Sign in successful',
      data: user.sanitize(),
    };
  }

  /**
   * Signs out a user by removing their session.
   * @param sessionId - The ID of the session to remove.
   * @param res - The HTTP response object.
   * @returns An ApiResponse indicating whether sign-out was successful.
   */
  async signOut(sessionId: string, res: Response): Promise<ApiResponse<null>> {
    const result = await this.sessionService.removeUserSession(sessionId, res);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return {
      status: true,
      message: 'Sign out successful',
    };
  }
  async verifyEmail(dto: VerifyEmailDto): Promise<ApiResponse<null>> {
    const verify = await this.emailService.verifyEmail(dto.token);
    if (!verify) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return {
      status: true,
      message: 'Verify email successful',
    };
  }
  // async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponse<null>> {
  //   return {
  //     status: true,
  //     message: 'A reset password email has  been sent to your email.',
  //   }
  // }
  //   async resetPassword(): Promise<ApiResponse> {
  //     return 'reset password';
  //   }
}
