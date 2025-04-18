import type { SelectUser } from '@/common/database/schemas/users.schema';
import { tryCatch } from '@/common/utils/try-catch.utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { randomBytes, createHmac } from 'node:crypto';
import { Resend } from 'resend';

const EMAIL_VERIFICATION_EXPIRY = 86400; // 24 hours
export type VerificationPurpose = 'email-verification' | 'forgot-password';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly config: ConfigService,
  ) {}

  /**
   * Creates a secure verification token and stores it in the cache
   *
   * @param userId - The user ID to associate with the token
   * @param purpose - The purpose of the verification (email verification or password reset)
   * @returns The generated token
   */
  private async createVerificationToken(
    userId: string,
    purpose: VerificationPurpose,
  ): Promise<string> {
    // Generate a random token
    const token = randomBytes(32).toString('hex');

    // Hash the token using HMAC with SHA-256
    const hashedToken = createHmac(
      'sha256',
      this.config.getOrThrow('VERIFICATION_TOKEN_SECRET'),
    )
      .update(token)
      .digest('hex');

    // Store the hashed token in the cache with an expiry time
    const key = `${purpose}:${hashedToken}`;
    await this.cacheManager.set(key, userId, EMAIL_VERIFICATION_EXPIRY * 1000);

    return token;
  }

  /**
   * Sends a verification email to the user
   *
   * @param user - The user object containing the email address
   */
  async sendEmailVerification(user: SelectUser): Promise<void> {
    // Creating a verification token
    const token = await tryCatch(
      this.createVerificationToken(user.id, 'email-verification'),
    );

    if (token.error) {
      this.logger.error(
        `Error while creating verification token for '${user.email}': `,
        token.error,
      );
      return;
    }

    // Constructing the verification link
    const verificationLink = new URL(
      '/verify-email',
      this.config.getOrThrow('FRONTEND_URL'),
    );
    verificationLink.searchParams.append('token', token.data);

    // Sending the verification email
    const resend = new Resend(this.config.getOrThrow('RESEND_API_KEY'));

    const { error } = await resend.emails.send({
      from: 'Email Verification <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Verify your email',
      html: this.buildVerificationEmailTemplate(
        user.username,
        verificationLink.href,
      ),
    });

    // Logging the error if any
    if (error) {
      this.logger.error(`Error while verifying '${user.email}': `, error);
    }
    return;
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
