
import { Injectable ,UnauthorizedException ,   NotFoundException,
} from "@nestjs/common";
import { randomBytes, createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { MessageRole } from "../generated/prisma/client.js";
@Injectable()
export class VisitorService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession() {
    // Generate a secure random visitor token
    const visitorToken = randomBytes(32).toString("hex");

    // Store only its SHA-256 hash in the database
    const tokenHash = createHash("sha256")
      .update(visitorToken)
      .digest("hex");

    // Session expires after 7 days
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await this.prisma.visitorSession.create({
      data: {
        sessionToken: tokenHash,
        expiresAt,
      },
    });

    // Return the raw token only to the visitor
    return {
      visitorToken,
      expiresAt,
    };
  }

  async validateSession(visitorToken: string) {
  if (!visitorToken || visitorToken.length !== 64) {
    throw new UnauthorizedException("Invalid visitor token.");
  }

  const tokenHash = createHash("sha256")
    .update(visitorToken)
    .digest("hex");

  const session = await this.prisma.visitorSession.findUnique({
    where: { sessionToken: tokenHash },
    select: {
      id: true,
      expiresAt: true,
      userId: true,
    },
  });

  if (!session || session.expiresAt <= new Date() || session.userId !== null) {
    throw new UnauthorizedException("Invalid or expired visitor session.");
  }

  const newExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  await this.prisma.visitorSession.update({
    where: { id: session.id },
    data: {
      lastActivityAt: new Date(),
      expiresAt: newExpiresAt,
    },
  });

  return {
    id: session.id,
    expiresAt: newExpiresAt,
  };
}
async createConversation(visitorSessionId: number) {
  return this.prisma.conversation.create({
    data: {
      visitorSessionId,
      titre: "Nouvelle conversation",
    },
    select: {
      id: true,
      titre: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async getConversations(visitorSessionId: number) {
  return this.prisma.conversation.findMany({
    where: {
      visitorSessionId,
    },
    select: {
      id: true,
      titre: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

async getConversation(
  visitorSessionId: number,
  conversationId: number,
) {
  return this.prisma.conversation.findFirst({
    where: {
      id: conversationId,
      visitorSessionId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}
async createMessage(
  visitorSessionId: number,
  conversationId: number,
  contenu: string,
) {
  const conversation = await this.prisma.conversation.findFirst({
    where: {
      id: conversationId,
      visitorSessionId,
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    throw new NotFoundException("Conversation not found.");
  }

  const message = await this.prisma.message.create({
    data: {
      conversationId,
      role: MessageRole.USER,
      contenu,
    },
  });

  await this.prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}
}
