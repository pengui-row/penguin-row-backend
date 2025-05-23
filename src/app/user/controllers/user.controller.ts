import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiSecretGuard } from 'src/authentication/guards/api-secret.guard';
import { UserService } from '../services/user.service';
import { GetUser } from 'src/authentication/decorators/get-user.decorator';
import { User } from 'src/authentication/entities';
import { CreateNotificationDto, GetNotificationsDto, ReadNotificationDto } from '../dto';

@UseGuards(ApiSecretGuard, AuthGuard())
@Controller('user')
export class UserController {
    constructor (private readonly userService: UserService) {}

    @Get('whoami')
    async getUser(@GetUser() user: User) {
        return this.userService.findOne(user);
    }

    @Post('notification')
    async createNotification(@GetUser() user: User, @Body() notification: CreateNotificationDto) {
        return this.userService.createNotification(user, notification);
    }

    @Get('notification')
    async getNotifications(@GetUser() user: User, @Query() query: GetNotificationsDto) {
        return this.userService.getReceivedNotifications(user, query.page, query.page_size)
    }

    @Put('notification')
    async readNotification(@GetUser() user: User, @Body() notification: ReadNotificationDto) {
        return this.userService.readNotification(user, notification);
    }
}
