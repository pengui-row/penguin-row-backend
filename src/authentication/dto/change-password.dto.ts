import { IsString, MinLength, MaxLength } from "class-validator";

export class ChangePasswordDto {
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    old_password: string;

    @IsString()
    @MinLength(8)
    @MaxLength(50)
    password: string;
}