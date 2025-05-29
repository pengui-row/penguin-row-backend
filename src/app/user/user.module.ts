import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { ApiSecretGuard } from 'src/authentication/guards/api-secret.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/authentication/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Notification } from './entities/notification.entity';

@Module({
  controllers: [UserController],
  providers: [UserService, ApiSecretGuard],
  imports: [
    TypeOrmModule.forFeature([Notification]),
    AuthModule,
    ConfigModule
  ],
  exports: [TypeOrmModule]
})
export class UserModule {}
