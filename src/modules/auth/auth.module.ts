import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SignUpService } from './services/sign-up.service';
import { SessionService } from './services/session.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SignInService } from './services/sign-in.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        cacheId: configService.getOrThrow<string>('AUTH_CACHE_ID'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [SignUpService, SignInService, SessionService, UsersService],
})
export class AuthModule {}
