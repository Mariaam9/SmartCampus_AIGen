
import {
  Injectable,
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from "@nestjs/common";

import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatRequest {
  conversation_id: number;
  message: string;
  history: ChatMessage[];
}

export interface AiChatResponse {
  response: string;
  model: string;
}

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>("AI_SERVICE_URL") ??
      "http://localhost:8000";
  }

  async generateResponse(
    request: AiChatRequest,
  ): Promise<AiChatResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<AiChatResponse>(
          `${this.aiServiceUrl}/api/v1/chat`,
          request,
          {
            timeout: 120000,
          },
        ),
      );

      return data;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ECONNABORTED"
      ) {
        throw new GatewayTimeoutException(
          "AI service response timed out.",
        );
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        throw new BadGatewayException(
          "AI service returned an error.",
        );
      }

      throw new ServiceUnavailableException(
        "Cannot connect to AI service.",
      );
    }
  }
}
