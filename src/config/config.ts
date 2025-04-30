import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    secret: process.env.API_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    pg: {
      type: process.env.DB_TYPE || 'postgres',
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      username: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
    },
    port: process.env.PORT || 3000,
  };
});
