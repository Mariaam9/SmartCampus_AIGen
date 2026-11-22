
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../../prisma/prisma.service.js";
import { AuthenticatedUser } from "../auth-user.interface.js";

interface JwtPayload {
  sub: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException("Authorization token is missing.");
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid authorization format.");
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired token.");
    }

    if (!Number.isInteger(payload.sub)) {
      throw new UnauthorizedException("Invalid token payload.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User no longer exists.");
    }

    request.user = user;

    return true;
  }
}
