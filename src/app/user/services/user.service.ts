import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile, User, UserInfo } from 'src/authentication/entities';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto, ReadNotificationDto } from '../dto';
import { NotificationStatus } from '../enums';

@Injectable()
export class UserService {
    constructor (
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(UserInfo)
        private readonly userInfoRepository: Repository<UserInfo>,
        @InjectRepository(Profile)
        private readonly profileRepository: Repository<Profile>,
    ) {}

    async findOne(user: User) {
        try {
            const queryBuilder = this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.id = :userId', { userId: user.id })

            const foundUser = queryBuilder.getOne()
            if (!foundUser) {
                throw new NotFoundException(`No se encontro el usuario`)
            }
            return foundUser
        } catch (error) {
            this.handleDBErrors(error)
        }
    }

    async createNotification(user: User, notification: CreateNotificationDto) {
        try {
            const newNotification = this.notificationRepository.create({
                user: user,
                userId: user.id,
                description: notification.description,
                userToNotifyId: notification.userToNotifyId,
                type: notification.type,
                relatedEntityId: notification.relatedEntityId,
                time_stamp: new Date()
            })
            return this.notificationRepository.save(newNotification)
        } catch (error) {
            this.handleDBErrors(error)
        }
    }

    async getReceivedNotifications(user: User, page: number = 1, page_size: number = 10) {
    if (!user || !user.id) {
      throw new InternalServerErrorException('El usuario es requerido para obtener notificaciones.');
    }
    const offset = (page - 1) * page_size;
    try {
      const [notifications, total] = await this.notificationRepository.createQueryBuilder('notification')
        .leftJoinAndSelect('notification.user', 'actorUser')
        .leftJoinAndSelect('actorUser.profile', 'actorUserProfile')
        .where('notification.userToNotifyId = :userToNotifyId', { userToNotifyId: user.id })
        .orderBy('notification.time_stamp', 'DESC')
        .skip(offset)
        .take(page_size)
        .getManyAndCount();

      if (!notifications || notifications.length === 0) {
        throw new NotFoundException('No se encontraron notificaciones para este usuario.');
      }

      const transformedNotifications = notifications.map(notification => ({
        ...notification,
        user: notification.user ? {
          id: notification.user.id,
          profile: notification.user.profile ? {
            name: notification.user.profile.name,
            lastName: notification.user.profile.lastName,
          } : null,
        } : null,
      }));
      return {
        data: transformedNotifications,
        total,
        currentPage: page,
        pageSize: page_size,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async readNotification(user: User, notification: ReadNotificationDto) {
    if (!user || !user.id) {
      throw new InternalServerErrorException('El usuario es requerido para modificar notificaciones.');
    }
    try {
        const updatedNotification = await this.notificationRepository.findOne({
            where: {
                userToNotifyId:  user.id ,
                id: notification.id
            },
            select: ['id','description','status','type'],
            relations: {
                user: false
            },
        });
        if (!updatedNotification) {
            throw new NotFoundException(`Notificación no encontrada para el usuario ${user.id} y la notificación ${notification.id}`);
        }
        updatedNotification.status = NotificationStatus.READ;
        return this.notificationRepository.save(updatedNotification);
    } catch (error) {
        this.handleDBErrors(error)
    }
  }

  async findUserInfo(user: User) {
    if (!user || !user.id) {
      throw new InternalServerErrorException('El usuario es requerido para modificar notificaciones.');
    }
    try {
      const userInfo = this.userInfoRepository.findOne({
        where: {
          user: { id: user.id }
        },
        select: ['id','experience','interests','location','professional_title','talents','user'],
        relations: { user: true },
      });

      if (!userInfo) {
        throw new NotFoundException(`No se encontro la información del usuario ${user.id}`)
      }
      
      return userInfo
    } catch (error) {
      this.handleDBErrors(error)
    }
  }

    private handleDBErrors(error: any): never {
        if (error.code === '23505') throw new BadRequestException(error.detail);
        console.log(error);
        throw new InternalServerErrorException('Please check server logs');
    }
}
