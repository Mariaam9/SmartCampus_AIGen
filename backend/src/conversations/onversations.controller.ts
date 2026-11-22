
import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  ParseIntPipe,
  Param,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthenticatedUser } from "../auth/auth-user.interface.js";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMyConversations(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.role !== "CANDIDAT") {
      throw new ForbiddenException(
        "Only candidates can access this endpoint.",
      );
    }

    return this.prisma.conversation.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        titre: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }
  @Get(":id")
async getMyConversation(
  @Param("id", ParseIntPipe) id: number,
  @CurrentUser() user: AuthenticatedUser,
) {
  if (user.role !== "CANDIDAT") {
    throw new ForbiddenException(
      "Only candidates can access this endpoint.",
    );
  }

  const conversation = await this.prisma.conversation.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    throw new NotFoundException("Conversation not found.");
  }

  return conversation;
}
}
