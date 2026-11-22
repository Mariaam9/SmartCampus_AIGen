
import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { ConversationsController } from "./onversations.controller.js"
import { ConversationsService } from "./conversations.service.js";
import { AiModule } from "../ai/ai.module.js";

@Module({
  imports: [PrismaModule, AuthModule, AiModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
