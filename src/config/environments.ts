import { ConfigModule } from '@nestjs/config';
import config from './config';
import { DynamicModule } from '@nestjs/common';
import * as Joi from 'joi';

export class Environments {
  /* Env files */
  private static enviromentFiles = {
    dev: '.env',
    stag: '.stag.env',
    prod: '.prod.env',
  };

  public static readonly executeEnvConfig = (): DynamicModule => {
    return ConfigModule.forRoot({
      envFilePath: this.enviromentFiles[process.env.NODE_ENV] || ['.env'],
      load: [config],
      isGlobal: true,
      validationSchema: this.getEnvSchema(),
    });
  };

  public static readonly getEnvSchema = (): Joi.ObjectSchema => {
    return Joi.object({
      secret: Joi.string(),
      jwtSecret: Joi.string(),
      pg: Joi.object({
        type: Joi.string().required(),
        host: Joi.string().required(),
        port: Joi.number().required(),
        username: Joi.string().required(),
        password: Joi.string().required(),
        database: Joi.string().required(),
      }),
      port: Joi.number(),
    });
  };
}
