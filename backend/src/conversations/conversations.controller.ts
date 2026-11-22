import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";

import { ConversationsService } from "./conversations.service.js";
import { SendMessageDto } from "./dto/send-message.dto.js";

@Controller("api/conversations")
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
  ) {}

  @Post()
  createConversation() {
    return this.conversationsService.createConversation();
  }

  @Post(":conversationId/messages")
  sendMessage(
    @Param("conversationId", ParseIntPipe) conversationId: number,
    @Headers("x-session-token") sessionToken: string | undefined,
    @Body() body: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(
      conversationId,
      sessionToken,
      body?.content,
    );
  }

  @Get(":conversationId/messages")
  getMessages(
    @Param("conversationId", ParseIntPipe) conversationId: number,
    @Headers("x-session-token") sessionToken: string | undefined,
  ) {
    return this.conversationsService.getMessages(
      conversationId,
      sessionToken,
    );
  }
}
