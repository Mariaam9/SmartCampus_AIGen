
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  Body,
} from "@nestjs/common";


import { CreateMessageDto } from "./dto/create-message.dto.js";
import { VisitorService } from "./visitor.service.js";
import { VisitorAuthGuard } from "./guards/visitor-auth.guard.js";
import type { VisitorSessionUser } from "./visitor-user.interface.js";
import { CurrentVisitor } from "./decorators/current-visitor.decorator.js";

@Controller("visitor")
export class VisitorController {
  constructor(
    private readonly visitorService: VisitorService,
  ) {}

  // Create a new visitor session
  @Post("session")
  createSession() {
    return this.visitorService.createSession();
  }

  // Test visitor authentication
  @Get("test")
  @UseGuards(VisitorAuthGuard)
  testVisitor(
    @Req() request: { visitor: VisitorSessionUser },
  ) {
    return {
      message: "Visitor authentication successful.",
      visitor: request.visitor,
    };
  }

  // Create a conversation for the visitor
  @Post("conversations")
  @UseGuards(VisitorAuthGuard)
  createConversation(
    @CurrentVisitor() visitor: VisitorSessionUser,
  ) {
    return this.visitorService.createConversation(visitor.id);
  }

  // Get all visitor conversations
  @Get("conversations")
  @UseGuards(VisitorAuthGuard)
  getConversations(
    @CurrentVisitor() visitor: VisitorSessionUser,
  ) {
    return this.visitorService.getConversations(visitor.id);
  }

  // Get a specific visitor conversation
  @Post("conversations/:id/messages")
@UseGuards(VisitorAuthGuard)
createMessage(
  @CurrentVisitor() visitor: VisitorSessionUser,
  @Param("id", ParseIntPipe) id: number,
  @Body() dto: CreateMessageDto,
) {
  return this.visitorService.createMessage(
    visitor.id,
    id,
    dto.contenu,
  );
}
}
