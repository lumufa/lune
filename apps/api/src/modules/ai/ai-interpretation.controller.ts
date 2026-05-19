import { Body, Controller, Headers, Post } from "@nestjs/common";
import type { AIInterpretationRequest, AIInterpretationSnapshot, AILanguage } from "@women-period/shared";
import { requireUserId } from "../../common/request-user";
import { AIInterpretationService } from "./ai-interpretation.service";

function resolveLanguage(raw: AILanguage | undefined): AILanguage {
  return raw === "en" ? "en" : "zh";
}

@Controller("cycles")
export class AIInterpretationController {
  constructor(private readonly service: AIInterpretationService) {}

  @Post("ai-interpretation")
  interpret(
    @Headers("x-user-id") userId: string | undefined,
    @Body() body: AIInterpretationRequest | undefined
  ): Promise<AIInterpretationSnapshot> {
    return this.service.interpretMonthly(
      requireUserId(userId),
      resolveLanguage(body?.language)
    );
  }
}
