import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { User } from '../users.entity';
import { Repository } from 'typeorm';

@ValidatorConstraint()
@Injectable()
export class IsUserUnique implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validate(
    value: string,
    validationArguments: ValidationArguments,
  ): Promise<boolean> {
    const field: string = validationArguments.property;
    const user = await this.userRepository.findOneBy({ [field]: value });

    return !user;
  }

  defaultMessage(args: ValidationArguments): string {
    return `The ${args.property} '${args.value}' is already taken.`;
  }
}
