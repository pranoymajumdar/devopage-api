import { ApiResponse } from '@/common/interface/response.interface';
import { Injectable } from '@nestjs/common';
import type { SafeUser } from '../users/users.entity';
import { UsersService } from '../users/users.service';
import type { SignUpDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Sign up a new user
   * @param dto - containing user details
   * @returns ApiResponse with the created user
   */
  async signUp(dto: SignUpDto): Promise<ApiResponse<SafeUser>> {
    const user = await this.usersService.create(dto);
    return {
      status: true,
      message: 'Sign up successful',
      data: user.sanitize(),
    };
  }
  //   async signIn(): Promise<ApiResponse> {
  //     return 'sign in';
  //   }
  //   async signOut(): Promise<ApiResponse> {
  //     return 'sign out';
  //   }
  //   async forgotPassword(): Promise<ApiResponse> {
  //     return 'forgot password';
  //   }
  //   async resetPassword(): Promise<ApiResponse> {
  //     return 'reset password';
  //   }
  //   async verifyEmail(): Promise<ApiResponse> {
  //     return 'verify email';
  //   }
}
