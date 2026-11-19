import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getData() {
    return this.prisma.etablissement.findMany({
      select: {
        id: true,
        code: true,
        nom: true,
        formations: {
          select: {
            id: true,
            nom: true,
            niveau: true,
            duree: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });
  }
}