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

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isEmailVerified = true;
    await this.usersRepository.save(user);
  }
  private async ensureEmailAndUsernameAreUnique(dto: SignUpDto): Promise<void> {
    const [emailExist, usernameExist] = await Promise.all([
      this.usersRepository.findOne({ where: { email: dto.email } }),
      this.usersRepository.findOne({ where: { username: dto.username } }),
    ]);

    if (emailExist) {
      throw new ConflictException('Email already exists');
    }

    if (usernameExist) {
      throw new ConflictException('Username already exists');
    }
  }
}
