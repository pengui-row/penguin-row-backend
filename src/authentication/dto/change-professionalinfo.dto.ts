import { IsString, IsOptional } from "class-validator";

export class ChangeProfessionalInfoDto {
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