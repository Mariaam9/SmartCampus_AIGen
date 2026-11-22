import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CatalogueController } from './catalogue.controller.js';
import { CatalogueService } from './catalogue.service.js';

@Module({ imports: [PrismaModule], controllers: [CatalogueController], providers: [CatalogueService] })
export class CatalogueModule {}
