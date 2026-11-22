import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { VisitorService } from "../visitor.service.js";
import { VisitorSessionUser } from "../visitor-user.interface.js";

@Injectable()
export class VisitorAuthGuard implements CanActivate {
  constructor(
    private readonly visitorService: VisitorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { "x-visitor-token"?: string };
      visitor?: VisitorSessionUser;
    }>();

    const visitorToken = request.headers["x-visitor-token"];

    if (!visitorToken || Array.isArray(visitorToken)) {
      throw new UnauthorizedException("Visitor token is missing.");
    }

    request.visitor = await this.visitorService.validateSession(
      visitorToken,
    );

    return true;
  }
}