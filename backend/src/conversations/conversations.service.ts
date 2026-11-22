
import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import { AiService } from "../ai/ai.service.js";
import { MessageRole } from "../generated/prisma/client.js";

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createMessage(
    userId: number,
    conversationId: number,
    contenu: string,
  ) {
    // 1. Verify conversation ownership.
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found.");
    }

    // 2. Retrieve the previous 10 messages.
    const previousMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        role: {
          in: [MessageRole.USER, MessageRole.ASSISTANT],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // 3. Convert history to the AI service format.
    const history = previousMessages.reverse().map((message) => ({
      role: message.role.toLowerCase() as "user" | "assistant",
      content: message.contenu,
    }));

    // 4. Save the user's message.
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.USER,
        contenu,
      },
    });

    // 5. Generate the AI response.
    const aiResult = await this.aiService.generateResponse({
      conversation_id: conversationId,
      message: contenu,
      history,
    });

    // 6. Save the assistant's response.
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        contenu: aiResult.response,
      },
    });

    // 7. Update conversation activity.
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 8. Return both messages.
    return {
      userMessage,
      assistantMessage,
      model: aiResult.model,
    };
  }
  async createConversation(userId: number) {
  return this.prisma.conversation.create({
    data: {
      userId,
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
}
