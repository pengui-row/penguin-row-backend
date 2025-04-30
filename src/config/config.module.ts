import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule as ConfigNestModule } from '@nestjs/config';

import { postgresConnection } from './database/postgres';
import config from './config';
import { Environments } from './environments';

@Module({
  imports: [
    ConfigNestModule.forRoot(),
    Environments.executeEnvConfig(),
    TypeOrmModule.forRootAsync({
      useFactory: postgresConnection,
      inject: [config.KEY],
    }),
  ],
  exports: [TypeOrmModule, ConfigNestModule, Environments.executeEnvConfig()],
})
export class ConfigModule {}
