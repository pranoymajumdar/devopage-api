import { Injectable, Logger } from '@nestjs/common';
import type { User } from '../users/users.entity';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/users/users.service';
import { tryCatch } from '@/common/utils/try-catch.utils';

@Injectable()
export class EmailService {
  private readonly logger: Logger = new Logger(EmailService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

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
   * Verifies the email token and marks the user's email as verified if valid.
   * @param token - The JWT email verification token received from the user.
   * @returns True if verification succeeded, false otherwise.
   */
  async verifyEmail(token: string): Promise<boolean> {
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
  async verifyPasswordReset(token: string): Promise<string | null> {
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
