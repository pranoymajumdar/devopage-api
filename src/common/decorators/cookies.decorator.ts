import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Parameter decorator to access cookies from the request
 * @param data Optional key to retrieve a specific cookie
 * @returns The specific cookie value if a key is provided, otherwise all cookies
 */
export const Cookies = createParamDecorator(
  <T>(data: string | undefined, ctx: ExecutionContext): T => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (data) {
      return req.cookies[data] as T;
    }

    return req.cookies as T;
  },
);
