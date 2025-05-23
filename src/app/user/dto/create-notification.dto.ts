import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { NotificationType } from "../enums";

export class CreateNotificationDto {
    @IsString()
    description: string;

    @IsString()
    @IsNotEmpty()
    userToNotifyId: string;

    @IsEnum(NotificationType)
    type: NotificationType

    @IsString()
    @IsOptional()
    relatedEntityId?: string;
}