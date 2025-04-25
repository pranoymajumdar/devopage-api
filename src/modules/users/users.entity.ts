import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Index('user_id_index', { unique: true })
  id: string;

  @Column('text')
  name: string;

  @Column('text', { unique: true })
  @Index('user_username_index', { unique: true })
  username: string;

  @Column('text')
  @Exclude()
  password: string;

  @Column('text', { unique: true })
  email: string;

  @Column('bool', { name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column('enum', { enum: UserRole, array: true, default: [UserRole.USER] })
  @Index('user_role_index')
  roles: UserRole[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt: string = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  validatePassword(inputPassword: string): Promise<boolean> {
    // Compare the input password with the hashed password
    return bcrypt.compare(inputPassword, this.password);
  }

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
