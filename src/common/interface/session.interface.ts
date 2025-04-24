import { UserRole } from '@/modules/users/users.entity';

export interface ISession {
  id: string;
  user: {
    id: string;
    roles: UserRole[];
    email: string;
  };
}
