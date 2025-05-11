import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserInfoDTO {
  @IsUUID()
  user_id: string;

  @IsArray()
  @IsOptional()
  interests?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  professional_title?: string;

  @IsString()
  @IsOptional()
  talents?: string;

  @IsString()
  @IsOptional()
  experience?: string;
}
