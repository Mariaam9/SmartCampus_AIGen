
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { RolesGuard } from "./guards/roles.guard.js";
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
          throw new Error("JWT_SECRET is missing from .env");
        }

        return {
          secret,
          signOptions: { expiresIn: "1d" },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard , RolesGuard],
exports: [AuthService, JwtAuthGuard, JwtAuthGuard,JwtModule]
})
export class AuthModule {}
