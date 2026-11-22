
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Headers,
} from "@nestjs/common";
import { Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { CurrentUser } from "./decorators/current-user.decorator.js";
import * as authUserInterface from "./auth-user.interface.js";
import { Roles } from "./decorators/roles.decorator.js";
import { RolesGuard } from "./guards/roles.guard.js";

import { AuthService } from "./auth.service.js";
import { RegisterCandidatDto } from "./dto/register-candidat.dto.js";
import { RegisterResponsableDto } from "./dto/register-responsable.dto.js";
import { LoginDto } from "./dto/login.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register/candidat")
  registerCandidat(@Body() dto: RegisterCandidatDto ,  @Headers("x-visitor-token") visitorToken?: string,) {
    return this.authService.registerCandidat(dto, visitorToken);
  }

  @Post("register/responsable")
  registerResponsable(@Body() dto: RegisterResponsableDto) {
    return this.authService.registerResponsable(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto,@Headers("x-visitor-token") visitorToken?: string,) {
    return this.authService.login(dto, visitorToken);
  }
  @Get("me")
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: authUserInterface.AuthenticatedUser) {
  return {
    message: "You are authenticated.",
    user,
  };
}
@Get("admin-test")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
adminTest(@CurrentUser() user: authUserInterface.AuthenticatedUser) {
  return {
    message: "Admin access granted.",
    user,
  };
}

@Get("candidat-test")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("CANDIDAT")
candidatTest(@CurrentUser() user: authUserInterface.AuthenticatedUser) {
  return {
    message: "Candidat access granted.",
    user,
  };
}
}
