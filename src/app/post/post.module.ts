import { Module } from '@nestjs/common';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment, Favorite, Like, Post } from './entities';
import { ApiSecretGuard } from 'src/authentication/guards/api-secret.guard';
import { AuthModule } from 'src/authentication/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [PostController],
  providers: [PostService, ApiSecretGuard],
  imports: [
    TypeOrmModule.forFeature([Post, Like, Comment, Favorite]),
    AuthModule,
    ConfigModule,
  ],
  exports: [TypeOrmModule]
})
export class PostModule {}
