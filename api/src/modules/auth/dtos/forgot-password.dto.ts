import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString({ message: 'Email must be a string.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Email must be valid.' })
  @MaxLength(100, { message: 'Email must be at most 100 characters.' })
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email: string;
}
