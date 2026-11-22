import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { CatalogueModule } from "./catalogue/catalogue.module";

@Module({
  imports: [PrismaModule, CatalogueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
