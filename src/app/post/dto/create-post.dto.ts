import { IsString, IsNotEmpty, IsDate, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  image_url: string;

  @IsDate()
  @IsOptional()
  time_stamp?: Date;
}
