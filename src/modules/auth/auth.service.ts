import { ApiResponse } from '@/common/interface/response.interface';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { SafeUser, User } from '../users/users.entity';
import { UsersService } from '../users/users.service';
import {
  SignUpDto,
  SignInDto,
  ForgotPasswordDto,
  VerifyEmailDto,
  ResetPasswordDto,
} from './dtos';
import { SessionService } from './session/session.service';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { tryCatch } from '@/common/utils/try-catch.utils';
import { JwtService } from '@nestjs/jwt';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Sign up a new user
   * @param dto - containing user details
   * @param res - the response object
   * @returns ApiResponse with the created user
   */
  async signUp(dto: SignUpDto, res: Response): Promise<ApiResponse<SafeUser>> {
    const user = await this.usersService.create(dto);
    void this.sendVerificationEmail(user);
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

  /**
   * Verifies a user's email address.
   * @param dto - containing the verification token
   * @returns An ApiResponse indicating whether the email verification was successful
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<ApiResponse<null>> {
    const verify = await this.validateEmailVerificationToken(dto.token);
    if (!verify) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return {
      status: true,
      message: 'Verify email successful',
    };
  }

  /**
   * Sends a password reset email to the user's email address.
   * @param dto - containing the user's email address
   * @returns An ApiResponse indicating whether the password reset email was sent successfully
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponse<null>> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email');

    const result = await this.sendPasswordResetEmail(user);
    return {
      status: true,
      message: result
        ? 'A reset password email has  been sent to your email.'
        : 'Failed to send reset password email please try again.',
    };
  }

  /**
   * Resets a user's password.
   * @param dto - containing the reset token and new password
   * @returns An ApiResponse indicating whether the password reset was successful
   */
  async resetPassword(dto: ResetPasswordDto): Promise<ApiResponse<null>> {
    const userId = await this.validateResetPassword(dto.token);
    if (!userId) throw new UnauthorizedException('Invalid or expired session');
    await this.usersService.updatePassword(userId, dto.password);

    return {
      status: true,
      message: 'Password reset successful',
    };
  }

  /**
   * Generates a signed JWT token for email verification.
   * @param userId - The ID of the user to include in the token payload.
   * @returns A JWT token string.
   */
  private generateVerificationToken(userId: string): string {
    return this.jwtService.sign({ userId });
  }

  /**
   * Sends an email verification link to the user.
   * @param user - The user to whom the verification email will be sent.
   */
  async sendVerificationEmail(user: User): Promise<void> {
    const token = this.generateVerificationToken(user.id);
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const resend = new Resend(this.configService.getOrThrow('RESEND_API_KEY'));
    const { error } = await resend.emails.send({
      from: `Verify Your Email <onboarding@resend.dev>`,
      to: [user.email],
      subject: 'Verify Your Email Address',
      html: this.buildVerificationEmailTemplate(
        user.username,
        verificationLink,
      ),
    });

    if (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Validates an email verification token.
   * @param token - The JWT email verification token received from the user.
   * @returns True if verification succeeded, false otherwise.
   */
  async validateEmailVerificationToken(token: string): Promise<boolean> {
    const payload = await tryCatch(
      this.jwtService.verifyAsync<{ userId: string }>(token),
    );

    if (payload.error) {
      return false;
    }

    const user = await this.usersService.findById(payload.data.userId);
    if (!user) return false;
    await this.usersService.markEmailAsVerified(user.id);
    return true;
  }

  /**
   * Sends an reset password link to the user.
   * @param user - The user to whom the verification email will be sent.
   */
  async sendPasswordResetEmail(user: User): Promise<boolean> {
    const token = this.generateVerificationToken(user.id);
    const verificationLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const resend = new Resend(this.configService.getOrThrow('RESEND_API_KEY'));

    const { error } = await resend.emails.send({
      from: `Reset Password <onboarding@resend.dev>`,
      to: [user.email],
      subject: 'Reset your password',
      html: this.buildPasswordResetEmailTemplate(
        user.username,
        verificationLink,
      ),
    });

    if (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
    return true;
  }

  async validateResetPassword(token: string): Promise<string | null> {
    const payload = await tryCatch(
      this.jwtService.verifyAsync<{ userId: string }>(token),
    );

    if (payload.error) {
      return null;
    }

    return payload.data.userId;
  }

  /**
   * Build HTML template for verification emails
   */
  private buildVerificationEmailTemplate(
    username: string,
    verificationLink: string,
  ): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verify Your Email Address</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${username},</h2>
            <p>Thank you for creating an account with us! To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, you can also copy and paste this URL into your browser:</p>
            <p style="background-color: #eee; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${verificationLink}
            </p>
            <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `;
  }

  /**
   * Build HTML template for password reset emails
   */
  private buildPasswordResetEmailTemplate(
    username: string,
    resetLink: string,
  ): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reset Your Password</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${username},</h2>
            <p>We received a request to reset your password. If you made this request, please click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, you can also copy and paste this URL into your browser:</p>
            <p style="background-color: #eee; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${resetLink}
            </p>
            <p><strong>Important:</strong> This link will expire in 24 hours.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `;
  }
}
