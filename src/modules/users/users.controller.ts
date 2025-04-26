import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@/common/decorators/roles.decorator';
import { UserRole } from './users.entity';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin')
  @Role(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  onlyAdmin(): string {
    return 'You are admin nice';
  }
  @Get('mod')
  @Role(UserRole.MODERATOR)
  @UseGuards(RolesGuard)
  onlyMod(): string {
    return 'You are mod nice';
  }

  @Get('user')
  @Role(UserRole.USER)
  @UseGuards(RolesGuard)
  onlyUser(): string {
    return 'You are user nice';
  }

  @Get('mod-admin')
  @Role(UserRole.MODERATOR, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  onlyModAdmin(): string {
    return 'You are mod and admin nice';
  }
}
