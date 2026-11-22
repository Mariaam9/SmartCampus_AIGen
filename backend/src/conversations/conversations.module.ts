
import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { ConversationsController } from "./onversations.controller.js"

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
