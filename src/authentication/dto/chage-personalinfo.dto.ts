import { IsArray, IsOptional } from "class-validator";

export class ChangePersonalInfoDto {
    @IsArray()
    @IsOptional()
    interests?: string[];
}