import {
  boolean,
  pgEnum,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const userRoles = ['admin', 'user'] as const;
export const userRolesEnum = pgEnum('user_roles', userRoles);
export type UserRoles = (typeof userRoles)[number];

export const usersTable = pgTable('users', {
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
});
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type PublicUser = Omit<
  typeof usersTable.$inferSelect,
  'password' | 'salt'
>;
