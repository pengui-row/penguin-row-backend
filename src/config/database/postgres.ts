import { ConfigType } from '@nestjs/config';
import config from '../config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const postgresConnection = async (
  configService: ConfigType<typeof config>,
) => {
  const { database, host, port, username, password, type } = configService.pg;
  return {
    type,
    host,
    port,
    username,
    password,
    database,
    autoLoadEntities: true,
    synchronize: true,
  } as TypeOrmModuleOptions;
};
