import { Body, Controller, Post } from '@nestjs/common';
import { SignUpService } from './services/sign-up.service';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInService } from './services/sign-in.service';
import type { IApiResponse } from '@/common/interface/response.interface';
import type { PublicUser } from '@/common/database/schemas/users.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUpService: SignUpService,
    private readonly signInService: SignInService,
  ) {}

  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto): Promise<IApiResponse<PublicUser>> {
    return this.signUpService.signUp(dto);
  }

  @Post('sign-in')
  async signIn(): Promise<unknown> {
    return this.signInService.signIn();
  }
}
