import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const userRoles = ['admin', 'user'] as const;
export const userRolesEnum = pgEnum('user_roles', userRoles);
export type UserRoles = (typeof userRoles)[number];

export const usersTable = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 100 }).notNull(),
    username: varchar({ length: 100 }).notNull().unique(),
    image: text(),
    email: varchar({ length: 320 }).notNull().unique(),
    password: varchar({ length: 128 }).notNull(),
    salt: text().notNull(),
    role: userRolesEnum().notNull().default('user'),
    isEmailVerified: boolean('is_email_verified').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('id_idx').on(table.id),
    index('email_idx').on(table.email),
    index('username_idx').on(table.username),
  ],
);
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type PublicUser = Omit<
  typeof usersTable.$inferSelect,
  'password' | 'salt'
>;
