import {
  IsDateString,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  lastName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  phone: string;

  @IsDateString()
  birthDate: Date;
}
