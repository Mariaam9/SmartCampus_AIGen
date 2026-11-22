import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { VisitorController } from "./visitor.controller.js";
import { VisitorService } from "./visitor.service.js";
import { VisitorAuthGuard } from "./guards/visitor-auth.guard.js";
import { AiModule } from "../ai/ai.module.js";

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [VisitorController],
  providers: [VisitorService, VisitorAuthGuard],
  exports: [VisitorService, VisitorAuthGuard],
})
export class VisitorModule {}