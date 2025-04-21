import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Parameter decorator to access cookies from the request.
 * @param cookieName Optional key to retrieve a specific cookie
 * @param defaultValue Optional default value if the cookie doesn't exist
 * @returns The specific cookie value if a key is provided, otherwise all cookies
 */
export const Cookies = createParamDecorator(
  (cookieName: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Ensure cookies object exists
    if (!request.cookies) {
      return cookieName ? undefined : {};
    }

    // If a specific cookie is requested
    if (cookieName) {
      return request.cookies[cookieName];
    }

    // Return all cookies
    return request.cookies;
  },
);
