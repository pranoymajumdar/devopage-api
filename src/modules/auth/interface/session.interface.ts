import type { UserRoles } from '@/common/database/schemas/users.schema';

export interface ISessionData {
  userId: string;
  userRole: UserRoles;
}
