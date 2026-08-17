import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return null as any;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
