import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          stores: [
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            new Keyv({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
              store: new CacheableMemory({ ttl: 60 * 60 * 24, lruSize: 5000 }),
            }),
            createKeyv(configService.getOrThrow('REDIS_URL')),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
