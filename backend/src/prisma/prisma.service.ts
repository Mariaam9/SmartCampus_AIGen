
import "dotenv/config";

import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL est absente du fichier .env",
      );
    }

    const adapter = new PrismaPg({ connectionString });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    console.log("✅ Connexion Prisma à PostgreSQL établie.");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    console.log("🔌 Connexion Prisma fermée.");
  }
}
