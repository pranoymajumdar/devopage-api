import {
  CanActivate,
  ForbiddenException,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Request } from 'express';
import type { ISession } from '../interface/session.interface';
import type { UserRole } from '@/modules/users/users.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    const request = ctx.switchToHttp().getRequest<Request>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const session: ISession | undefined = request.session;

    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!session?.user.role)
      throw new ForbiddenException('Access denied. No session or roles.');

    const userRole = session.user.role;

    const canAccess = requiredRoles.some(
      (requiredRole) => userRole >= requiredRole,
    );
    if (!canAccess) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(',')}`,
      );
    }
    return true;
  }
}
