import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from 'src/config/config.module';
import { AuthModule } from 'src/authentication/auth.module';
import { PostModule } from 'src/app/post/post.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [ConfigModule, AuthModule, PostModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
