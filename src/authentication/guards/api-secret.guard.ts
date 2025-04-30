import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import config from 'src/config/config';

@Injectable()
export class ApiSecretGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(config.KEY) private configServices: ConfigType<typeof config>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['api-secret'];

    console.log({ authHeader });

    const isAuth = authHeader === this.configServices.secret;

    if (!isAuth) {
      throw new UnauthorizedException('Not Allowed');
    }

    return isAuth;
  }
}
