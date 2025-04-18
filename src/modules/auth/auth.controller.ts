import { Body, Controller, Post, Res } from '@nestjs/common';
import { SignUpService } from './services/sign-up.service';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInService } from './services/sign-in.service';
import type { IApiResponse } from '@/common/interface/response.interface';
import type { PublicUser } from '@/common/database/schemas/users.schema';
import { SignInDto } from './dtos/sign-in.dto';
import type { Response } from 'express';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { VerifyEmailService } from './services/verify-email.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUpService: SignUpService,
    private readonly signInService: SignInService,
    private readonly verifyEmailService: VerifyEmailService,
  ) {}

  @Post('sign-up')
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IApiResponse<PublicUser>> {
    return this.signUpService.signUp(dto, res);
  }

  @Post('sign-in')
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IApiResponse<PublicUser>> {
    return this.signInService.signIn(dto, res);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<IApiResponse<null>> {
    return this.verifyEmailService.verifyEmail(dto);
  }
}
