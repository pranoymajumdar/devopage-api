import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { type User, UserRole } from './users.entity';
import { Roles } from '@/common/decorators/roles.decorator';
import type { Request } from 'express';
import type { SessionUser } from '@/common/interface/session.interface';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request): SessionUser {
    return req.session!.user;
  }

  @Get(':username')
  async findByUsername(
    @Param() params: { username: string },
  ): Promise<User | null> {
    return this.usersService.findByUsername(params.username);
  }
}
