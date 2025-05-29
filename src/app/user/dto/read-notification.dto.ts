import { IsString } from "class-validator";

export class ReadNotificationDto {
    @IsString()
    id: string;
}