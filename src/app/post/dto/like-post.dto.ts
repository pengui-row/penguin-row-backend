import { IsUUID } from "class-validator";

export class LikePostDto {
    @IsUUID()
    id: string;
}