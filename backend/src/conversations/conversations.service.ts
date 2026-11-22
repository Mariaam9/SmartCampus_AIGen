import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

@Injectable()
export class ConversationsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly sessionTtlMinutes = positiveInteger(
    process.env.SESSION_TTL_MINUTES,
    60,
  );

  private readonly maxSessionMessages = positiveInteger(
    process.env.SESSION_MAX_MESSAGES,
    50,
  );

  private readonly contextMessages = positiveInteger(
    process.env.CONVERSATION_CONTEXT_MESSAGES,
    12,
  );

  private readonly messageTtlHours = positiveInteger(
    process.env.MESSAGE_TTL_HOURS,
    24,
  );

  private readonly cleanupIntervalMinutes = positiveInteger(
    process.env.SESSION_CLEANUP_INTERVAL_MINUTES,
    5,
  );

  private readonly maxMessageLength = positiveInteger(
    process.env.MAX_MESSAGE_LENGTH,
    5000,
  );

  private cleanupTimer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    // Nettoyage au démarrage.
    void this.cleanupExpiredData().catch((error: unknown) => {
      console.error("Erreur lors du nettoyage initial :", error);
    });

    // Nettoyage périodique.
    this.cleanupTimer = setInterval(
      () => {
        void this.cleanupExpiredData().catch((error: unknown) => {
          console.error("Erreur lors du nettoyage automatique :", error);
        });
      },
      this.cleanupIntervalMinutes * 60 * 1000,
    );

    this.cleanupTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Crée automatiquement une session visiteur
   * et une nouvelle conversation.
   */
  async createConversation() {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.sessionTtlMinutes * 60 * 1000,
    );

    const sessionToken = randomBytes(32).toString("hex");

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.visitorSession.create({
        data: {
          sessionToken,
          expiresAt,
        },
      });

      const conversation = await tx.conversation.create({
        data: {
          visitorSessionId: session.id,
          titre: "Nouvelle conversation",
        },
      });

      return {
        conversationId: conversation.id,
        sessionToken,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        messageLimit: this.maxSessionMessages,
        contextLimit: this.contextMessages,
      };
    });
  }

  /**
   * Enregistre un message utilisateur et récupère
   * les derniers messages utiles pour le contexte IA.
   */
  async sendMessage(
    conversationId: number,
    sessionToken: string | undefined,
    rawContent: unknown,
  ) {
    if (!sessionToken) {
      throw new UnauthorizedException(
        "Le token de session est obligatoire.",
      );
    }

    const content =
      typeof rawContent === "string" ? rawContent.trim() : "";

    if (!content) {
      throw new BadRequestException("Le message ne peut pas être vide.");
    }

    if (content.length > this.maxMessageLength) {
      throw new BadRequestException(
        `Le message ne peut pas dépasser ${this.maxMessageLength} caractères.`,
      );
    }

    const now = new Date();
    const newExpiresAt = new Date(
      now.getTime() + this.sessionTtlMinutes * 60 * 1000,
    );

    const messageExpiresAt = new Date(
      now.getTime() + this.messageTtlHours * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      // Vérifier que la conversation appartient à cette session.
      const conversation = await tx.conversation.findFirst({
        where: {
          id: conversationId,
          visitorSession: {
            is: { sessionToken },
          },
        },
        select: {
          id: true,
          visitorSession: {
            select: {
              id: true,
              expiresAt: true,
              messageCount: true,
            },
          },
        },
      });

      if (!conversation || !conversation.visitorSession) {
        throw new NotFoundException(
          "Conversation introuvable pour cette session.",
        );
      }

      const session = conversation.visitorSession;

      if (session.expiresAt <= now) {
        throw new GoneException("La session visiteur a expiré.");
      }

      if (session.messageCount >= this.maxSessionMessages) {
        throw new HttpException(
          "La limite de messages de cette session est atteinte.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      /*
       * Incrément atomique :
       * empêche deux requêtes simultanées de dépasser
       * la limite de messages.
       */
      const update = await tx.visitorSession.updateMany({
        where: {
          id: session.id,
          sessionToken,
          expiresAt: { gt: now },
          messageCount: { lt: this.maxSessionMessages },
        },
        data: {
          messageCount: { increment: 1 },
          lastActivityAt: now,
          expiresAt: newExpiresAt,
        },
      });

      if (update.count !== 1) {
        const currentSession = await tx.visitorSession.findUnique({
          where: { id: session.id },
          select: {
            expiresAt: true,
            messageCount: true,
          },
        });

        if (!currentSession || currentSession.expiresAt <= now) {
          throw new GoneException("La session visiteur a expiré.");
        }

        throw new HttpException(
          "La limite de messages de cette session est atteinte.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Enregistrer le message utilisateur.
      const savedMessage = await tx.message.create({
        data: {
          conversationId,
          role: "USER",
          contenu: content,
          expiresAt: messageExpiresAt,
        },
      });

      // Récupérer les derniers messages encore valides.
      const recentMessages = await tx.message.findMany({
        where: {
          conversationId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: this.contextMessages,
        select: {
          role: true,
          contenu: true,
          createdAt: true,
        },
      });

      const context = recentMessages.reverse().map((message) => ({
        role: message.role,
        content: message.contenu,
        createdAt: message.createdAt,
      }));

      return {
        message: savedMessage,
        context,
        session: {
          expiresAt: newExpiresAt,
          remainingMessages:
            this.maxSessionMessages - session.messageCount - 1,
        },
      };
    });
  }

  /**
   * Récupère les messages d'une conversation.
   * La lecture renouvelle également l'activité de la session.
   */
  async getMessages(
    conversationId: number,
    sessionToken: string | undefined,
  ) {
    if (!sessionToken) {
      throw new UnauthorizedException(
        "Le token de session est obligatoire.",
      );
    }

    const now = new Date();

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        visitorSession: {
          is: { sessionToken },
        },
      },
      select: {
        id: true,
        visitorSession: {
          select: {
            id: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!conversation || !conversation.visitorSession) {
      throw new NotFoundException(
        "Conversation introuvable pour cette session.",
      );
    }

    const session = conversation.visitorSession;

    if (session.expiresAt <= now) {
      throw new GoneException("La session visiteur a expiré.");
    }

    const newExpiresAt = new Date(
      now.getTime() + this.sessionTtlMinutes * 60 * 1000,
    );

    const update = await this.prisma.visitorSession.updateMany({
      where: {
        id: session.id,
        sessionToken,
        expiresAt: { gt: now },
      },
      data: {
        lastActivityAt: now,
        expiresAt: newExpiresAt,
      },
    });

    if (update.count !== 1) {
      throw new GoneException("La session visiteur a expiré.");
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const context = messages.slice(-this.contextMessages).map((message) => ({
      role: message.role,
      content: message.contenu,
      createdAt: message.createdAt,
    }));

    return {
      conversationId,
      messages,
      context,
      expiresAt: newExpiresAt,
    };
  }


  /**
   * Enregistre temporairement une réponse de l'assistant.
   * Ne consomme pas le quota des messages utilisateur.
   */
  async saveAssistantMessage(
    conversationId: number,
    sessionToken: string | undefined,
    rawContent: unknown,
  ) {
    if (!sessionToken) {
      throw new UnauthorizedException(
        "Le token de session est obligatoire.",
      );
    }

    const content =
      typeof rawContent === "string" ? rawContent.trim() : "";

    if (!content) {
      throw new BadRequestException(
        "La réponse de l'assistant ne peut pas être vide.",
      );
    }

    if (content.length > this.maxMessageLength) {
      throw new BadRequestException(
        `La réponse ne peut pas dépasser ${this.maxMessageLength} caractères.`,
      );
    }

    const now = new Date();
    const newExpiresAt = new Date(
      now.getTime() + this.sessionTtlMinutes * 60 * 1000,
    );
    const messageExpiresAt = new Date(
      now.getTime() + this.messageTtlHours * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findFirst({
        where: {
          id: conversationId,
          visitorSession: {
            is: { sessionToken },
          },
        },
        select: {
          id: true,
          visitorSession: {
            select: {
              id: true,
              expiresAt: true,
            },
          },
        },
      });

      if (!conversation || !conversation.visitorSession) {
        throw new NotFoundException(
          "Conversation introuvable pour cette session.",
        );
      }

      const session = conversation.visitorSession;

      if (session.expiresAt <= now) {
        throw new GoneException("La session visiteur a expiré.");
      }

      const update = await tx.visitorSession.updateMany({
        where: {
          id: session.id,
          sessionToken,
          expiresAt: { gt: now },
        },
        data: {
          lastActivityAt: now,
          expiresAt: newExpiresAt,
        },
      });

      if (update.count !== 1) {
        throw new GoneException("La session visiteur a expiré.");
      }

      const savedMessage = await tx.message.create({
        data: {
          conversationId,
          role: "ASSISTANT",
          contenu: content,
          expiresAt: messageExpiresAt,
        },
      });

      const recentMessages = await tx.message.findMany({
        where: {
          conversationId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: this.contextMessages,
        select: {
          role: true,
          contenu: true,
          createdAt: true,
        },
      });

      return {
        message: savedMessage,
        context: recentMessages.reverse().map((message) => ({
          role: message.role,
          content: message.contenu,
          createdAt: message.createdAt,
        })),
        expiresAt: newExpiresAt,
      };
    });
  }

  /**
   * Supprime périodiquement les données temporaires expirées.
   */
  private async cleanupExpiredData(): Promise<void> {
    const now = new Date();

    const [deletedMessages, deletedConversations, deletedSessions] =
      await this.prisma.$transaction([
        this.prisma.message.deleteMany({
          where: {
            expiresAt: { lte: now },
          },
        }),

        this.prisma.conversation.deleteMany({
          where: {
            visitorSession: {
              is: {
                expiresAt: { lte: now },
              },
            },
          },
        }),

        this.prisma.visitorSession.deleteMany({
          where: {
            expiresAt: { lte: now },
          },
        }),
      ]);

    const total =
      deletedMessages.count +
      deletedConversations.count +
      deletedSessions.count;

    if (total > 0) {
      console.log(
        `Nettoyage temporaire : ${deletedMessages.count} messages, ` +
        `${deletedConversations.count} conversations, ` +
        `${deletedSessions.count} sessions supprimés.`,
      );
    }
  }
}