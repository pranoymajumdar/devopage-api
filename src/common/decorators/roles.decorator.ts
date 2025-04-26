import { UserRole } from '@/modules/users/users.entity';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'role';
export const Role = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
