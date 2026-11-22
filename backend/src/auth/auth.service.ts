
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service.js";
import { RegisterCandidatDto } from "./dto/register-candidat.dto.js";
import { RegisterResponsableDto } from "./dto/register-responsable.dto.js";
import { LoginDto } from "./dto/login.dto.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

 private async transferVisitorConversations(
  tx: any,
  userId: number,
  visitorToken?: string,
): Promise<number> {
  if (!visitorToken) {
    return 0;
  }

  if (visitorToken.length !== 64) {
    throw new UnauthorizedException("Invalid visitor token.");
  }

  const tokenHash = createHash("sha256")
    .update(visitorToken)
    .digest("hex");

  const session = await tx.visitorSession.findUnique({
    where: { sessionToken: tokenHash },
    select: {
      id: true,
      expiresAt: true,
      userId: true,
    },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.userId !== null
  ) {
    throw new UnauthorizedException(
      "Invalid, expired, or converted visitor session.",
    );
  }

  const result = await tx.conversation.updateMany({
    where: {
      visitorSessionId: session.id,
    },
    data: {
      userId,
      visitorSessionId: null,
    },
  });

  await tx.visitorSession.update({
    where: { id: session.id },
    data: { userId },
  });

  return result.count;
}



  async registerCandidat(dto: RegisterCandidatDto, visitorToken?: string) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("This email is already registered.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email,
      passwordHash,
      nom: dto.nom.trim(),
      prenom: dto.prenom.trim(),
      telephone: dto.telephone,
      role: "CANDIDAT",
      candidat: {
        create: {},
      },
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      role: true,
      createdAt: true,
    },
  });

  const transferredConversations =
    await this.transferVisitorConversations(tx, user.id, visitorToken);

  return { user, transferredConversations };
});

return {
  message: "Candidate account created successfully.",
  ...result,
};
  }

  
async registerResponsable(dto: RegisterResponsableDto) {
  const email = dto.email.trim().toLowerCase();

  const existingUser = await this.prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictException("This email is already registered.");
  }

  const passwordHash = await bcrypt.hash(dto.password, 12);

  const user = await this.prisma.user.create({
    data: {
      email,
      passwordHash,
      nom: dto.nom.trim(),
      prenom: dto.prenom.trim(),
      telephone: dto.telephone,
      role: "RESPONSABLE",
      responsable: {
        create: {
          fonction: dto.fonction,
          service: dto.service,
        },
      },
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      role: true,
      createdAt: true,
    },
  });

  return {
    message: "Responsible account created successfully.",
    user,
  };
}


  
async login(dto: LoginDto, visitorToken?: string) {
  const email = dto.email.trim().toLowerCase();

  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedException("Invalid email or password.");
  }

  const passwordIsValid = await bcrypt.compare(
    dto.password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    throw new UnauthorizedException("Invalid email or password.");
  }

  // Transfer visitor conversations only for candidates.
  let transferredConversations = 0;

  if (user.role === "CANDIDAT" && visitorToken) {
    transferredConversations = await this.prisma.$transaction(
      async (tx) => {
        return this.transferVisitorConversations(
          tx,
          user.id,
          visitorToken,
        );
      },
    );
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = await this.jwtService.signAsync(payload);

  const { passwordHash, ...safeUser } = user;

  return {
    message: "Login successful.",
    access_token: accessToken,
    user: safeUser,
    transferredConversations,
  };
}

}
