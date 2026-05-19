import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException
} from "@nestjs/common";
import type {
  AIInterpretationSnapshot,
  AILanguage,
  AISanitizedPayload,
  CycleDashboard,
  CycleRecord,
  FlowLevel,
  MoodTag,
  SymptomTag
} from "@women-period/shared";
import { ConsentService } from "../consent/consent.service";
import { CycleService } from "../cycle/cycle.service";
import {
  buildSystemPrompt,
  buildUserPrompt,
  getDisclaimer
} from "./prompt-templates";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 1;
const MAX_HIGHLIGHTS = 5;

@Injectable()
export class AIInterpretationService {
  private readonly logger = new Logger(AIInterpretationService.name);

  constructor(
    private readonly cycleService: CycleService,
    private readonly consentService: ConsentService
  ) {}

  async interpretMonthly(
    userId: string,
    language: AILanguage
  ): Promise<AIInterpretationSnapshot> {
    this.assertConsent(userId);

    const dashboard = this.cycleService.getDashboard(userId);
    const payload = this.buildSanitizedPayload(dashboard, language);

    const provider = process.env.LLM_PROVIDER ?? "doubao";
    const endpoint = process.env.LLM_ENDPOINT;
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL ?? "doubao-lite";

    if (!endpoint || !apiKey) {
      throw new ServiceUnavailableException(
        "AI interpretation service is not configured (LLM_ENDPOINT/LLM_API_KEY missing)"
      );
    }

    const { interpretation, highlights } = await this.callLLM({
      endpoint,
      apiKey,
      model,
      system: buildSystemPrompt(language),
      user: buildUserPrompt(payload)
    });

    return {
      generatedAt: new Date().toISOString(),
      language,
      interpretation,
      highlights: highlights.slice(0, MAX_HIGHLIGHTS),
      disclaimer: getDisclaimer(language),
      modelProvider: provider
    };
  }

  private assertConsent(userId: string): void {
    const consents = this.consentService.listConsents(userId);
    const granted = consents.some(
      (record) =>
        record.type === "ai_monthly_interpretation" && record.status === "granted"
    );
    if (!granted) {
      throw new ForbiddenException(
        "ai_monthly_interpretation consent required"
      );
    }
  }

  /**
   * Strict allow-list sanitizer. Anything not explicitly listed below must NOT
   * leave this process. Do not add fields without reviewing docs/ai-interpretation.md.
   */
  buildSanitizedPayload(
    dashboard: CycleDashboard,
    language: AILanguage
  ): AISanitizedPayload {
    const records = dashboard.records;
    const total = records.length || 1;
    const flowCounts: Record<FlowLevel, number> = { light: 0, medium: 0, heavy: 0 };

    for (const record of records) {
      flowCounts[record.flowLevel] += 1;
    }

    const flowDistribution = {
      light: Math.round((flowCounts.light / total) * 100),
      medium: Math.round((flowCounts.medium / total) * 100),
      heavy: Math.round((flowCounts.heavy / total) * 100)
    };

    return {
      cycleCount: dashboard.summary.recordCount,
      averageCycleLength: dashboard.summary.averageCycleLength,
      averagePeriodLength: dashboard.summary.averagePeriodLength,
      cycleVariability: dashboard.prediction.cycleVariability,
      flowDistribution,
      topSymptoms: this.topSymptoms(records),
      topMoods: this.topMoods(records),
      predictionStatus: dashboard.prediction.status,
      language
    };
  }

  private topSymptoms(records: CycleRecord[]): SymptomTag[] {
    const counts = new Map<SymptomTag, number>();
    for (const record of records) {
      for (const symptom of record.symptoms) {
        if (symptom === "none") continue;
        counts.set(symptom, (counts.get(symptom) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);
  }

  private topMoods(records: CycleRecord[]): MoodTag[] {
    const counts = new Map<MoodTag, number>();
    for (const record of records) {
      counts.set(record.mood, (counts.get(record.mood) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map((entry) => entry[0]);
  }

  private async callLLM(args: {
    endpoint: string;
    apiKey: string;
    model: string;
    system: string;
    user: string;
  }): Promise<{ interpretation: string; highlights: string[] }> {
    const body = {
      model: args.model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    };

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(args.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${args.apiKey}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        if (response.status === 429 || response.status >= 500) {
          lastError = new BadGatewayException(
            `LLM upstream error ${response.status}`
          );
          continue;
        }

        if (!response.ok) {
          throw new BadGatewayException(
            `LLM upstream error ${response.status}`
          );
        }

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        return this.parseModelContent(content);
      } catch (error) {
        lastError = error;
        if (attempt === MAX_RETRIES) break;
      } finally {
        clearTimeout(timer);
      }
    }

    this.logger.error("LLM call failed", lastError);
    throw new BadGatewayException("AI interpretation upstream failed");
  }

  private parseModelContent(content: string): {
    interpretation: string;
    highlights: string[];
  } {
    const trimmed = content.trim();
    // Some models wrap JSON in markdown fences — strip them defensively.
    const unwrapped = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    let parsed: { interpretation?: unknown; highlights?: unknown };
    try {
      parsed = JSON.parse(unwrapped) as typeof parsed;
    } catch {
      throw new BadGatewayException("AI response was not valid JSON");
    }

    const interpretation =
      typeof parsed.interpretation === "string" ? parsed.interpretation.trim() : "";
    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights.filter((item): item is string => typeof item === "string").map((item) => item.trim())
      : [];

    if (!interpretation || highlights.length === 0) {
      throw new BadGatewayException("AI response missing interpretation/highlights");
    }

    return { interpretation, highlights };
  }
}
