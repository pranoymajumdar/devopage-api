import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { tryCatch } from '@/common/utils/try-catch.utils';
import { SignUpDto } from '../auth/dtos';

@Injectable()
export class UsersService {
  private readonly logger: Logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   * @param dto - containing user details
   * @returns Created user
   */
  async create(dto: SignUpDto): Promise<User> {
    await this.ensureEmailAndUsernameAreUnique(dto);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      username: dto.username,
      password: dto.password,
    });
    const result = await tryCatch(this.usersRepository.save(user));

    if (result.error) {
      this.logger.error('Error creating user', result.error);
      throw new InternalServerErrorException(
        'An error occurred while creating the user, please try again later.',
      );
    }
    return result.data;
  }

  /**
   * Find a user by their ID
   * @param id - The ID of the user to find
   * @returns The user if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Find a user by their email
   * @param email - The email of the user to find
   * @returns The user if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find a user by their username
   * @param username - The username of the user to find
   * @returns The user if found, null otherwise
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  /**
   * Mark a user's email as verified
   * @param userId - The ID of the user to mark as verified
   */
  async markEmailAsVerified(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isEmailVerified = true;
    await this.usersRepository.save(user);
  }

  /**
   * Ensure that the email and username are unique
   * @param dto - containing user details
   */
  private async ensureEmailAndUsernameAreUnique(dto: SignUpDto): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Email already exists');
      }
      throw new ConflictException('Username already exists');
    }
  }
}
