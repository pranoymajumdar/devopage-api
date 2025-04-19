import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { ApiResponse } from '@/common/interface/response.interface';
import type { SafeUser } from '../users/users.entity';
import { SignUpDto } from './dtos/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto): Promise<ApiResponse<SafeUser>> {
    return this.authService.signUp(dto);
  }

  // @Post('sign-in')
  // signIn() {
  //   return 'sign in';
  // }

  // @Post('sign-out')
  // signOut() {
  //   return 'sign out';
  // }

  // @Post('forgot-password')
  // forgotPassword() {
  //   return 'forgot password';
  // }

  // @Post('reset-password')
  // resetPassword() {
  //   return 'reset password';
  // }

  // @Post('verify-email')
  // verifyEmail() {
  //   return 'verify email';
  // }
}
