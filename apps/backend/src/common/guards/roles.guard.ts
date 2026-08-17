/* eslint-disable */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true; // No roles restricted
    }
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException(
        'Access denied. Insufficient role permissions.',
      );
    }

    const hasRole = () =>
      user.roles.some((role: string) => requiredRoles.includes(role));
    if (!hasRole()) {
      throw new ForbiddenException(
        'Access denied. Insufficient role permissions.',
      );
    }

    return true;
  }
}
