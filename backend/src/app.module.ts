import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { CatalogueModule } from "./catalogue/catalogue.module.js";
import { AuthModule } from './auth/auth.module.js';
import { VisitorModule } from "./visitor/visitor.module.js";
import { ConversationsModule } from "./conversations/conversations.module.js";
@Module({
  imports: [PrismaModule, CatalogueModule, AuthModule, VisitorModule, ConversationsModule ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
