import { UserRole } from '@/modules/users/users.entity';

export interface ISession {
  id: string;
  user: {
    id: string;
    role: UserRole[];
    email: string;
  };
}
