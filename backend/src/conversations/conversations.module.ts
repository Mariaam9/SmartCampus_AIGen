import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";

import {
  ConversationsController as AuthenticatedConversationsController,
} from "./onversations.controller.js";

import {
  ConversationsController as VisitorConversationsController,
} from "./conversations.controller.js";

import { ConversationsService } from "./conversations.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AuthenticatedConversationsController,
    VisitorConversationsController,
  ],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
