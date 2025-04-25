import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { ApiResponse } from '@/common/interface/response.interface';
import type { User } from '../users/users.entity';
import { SignUpDto } from './dtos/sign-up.dto';
import type { Response } from 'express';
import { SignInDto } from './dtos/sign-in.dto';
import { Cookies } from '@/common/decorators/cookies.decorator';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '@/modules/auth/dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @UseInterceptors(ClassSerializerInterceptor)
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<User>> {
    return this.authService.signUp(dto, res);
  }

  @Post('sign-in')
  @UseInterceptors(ClassSerializerInterceptor)
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<User>> {
    return this.authService.signIn(dto, res);
  }

  @Post('sign-out')
  async signOut(
    @Cookies('sessionId') sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<null>> {
    return this.authService.signOut(sessionId, res);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<ApiResponse<null>> {
    return this.authService.verifyEmail(dto);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ApiResponse<null>> {
    return this.authService.forgotPassword(dto);
  }
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ApiResponse<null>> {
    return this.authService.resetPassword(dto);
  }
}
