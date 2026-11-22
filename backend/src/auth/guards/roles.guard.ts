import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, UserRole } from "../decorators/roles.decorator.js";
import { AuthenticatedUser } from "../auth-user.interface.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No role restriction means any authenticated user can access.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();

    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException(
        "You do not have permission to access this resource.",
      );
    }

    return true;
  }
}