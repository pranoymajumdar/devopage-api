import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
}
