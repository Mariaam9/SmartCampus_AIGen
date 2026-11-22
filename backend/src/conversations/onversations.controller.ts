
import {
  Controller,
  Get,
  Post,
  Body,
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
import { CreateMessageDto } from "../visitor/dto/create-message.dto.js";
import { ConversationsService } from "./conversations.service.js";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) {}

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

  @Post(":id/messages")
  async createMessage(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMessageDto,
  ) {
    if (user.role !== "CANDIDAT") {
      throw new ForbiddenException(
        "Only candidates can send messages.",
      );
    }

    return this.conversationsService.createMessage(
      user.id,
      id,
      dto.contenu,
    );
  }

  @Post()
  async createConversation(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.role !== "CANDIDAT") {
      throw new ForbiddenException(
        "Only candidates can create conversations.",
      );
    }

    return this.conversationsService.createConversation(user.id);
  }
}
