import { DATABASE_CONNECTION } from '@/common/database/database.connection';
import {
  InsertUser,
  PublicUser,
  SelectUser,
  usersTable,
} from '@/common/database/schemas/users.schema';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase,
  ) {}
  sanitizeUser(user: SelectUser): PublicUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, salt, ...rest } = user;
    return rest;
  }
  async createUser(values: InsertUser): Promise<SelectUser> {
    const [user] = await this.db.insert(usersTable).values(values).returning();

    return user;
  }
  async findUserBy(
    type: 'email' | 'id' | 'username',
    value: string,
  ): Promise<SelectUser | null> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable[type], value));
    return user;
  }
}
