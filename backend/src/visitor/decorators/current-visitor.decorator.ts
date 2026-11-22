import {
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";

import { VisitorSessionUser } from "../visitor-user.interface.js";

export const CurrentVisitor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): VisitorSessionUser => {
    const request = context.switchToHttp().getRequest<{
      visitor: VisitorSessionUser;
    }>();

    return request.visitor;
  },
);