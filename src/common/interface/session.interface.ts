import type { User } from '@/modules/users/users.entity';
export type SessionUser = Pick<
  User,
  | 'id'
  | 'name'
  | 'username'
  | 'email'
  | 'isEmailVerified'
  | 'role'
  | 'createdAt'
  | 'updatedAt'
>;
export interface ISession {
  id: string;
  user: SessionUser;
}
