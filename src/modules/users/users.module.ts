import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { IsUserUnique } from './validators/is-user-unique.validator';
import { SessionService } from '@/common/services/session.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, IsUserUnique, SessionService],
  exports: [UsersService],
})
export class UsersModule {}
