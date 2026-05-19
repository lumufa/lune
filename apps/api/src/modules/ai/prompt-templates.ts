import type { AILanguage, AISanitizedPayload } from "@women-period/shared";

export const AI_DISCLAIMER_ZH =
  "本解读基于你近期的脱敏统计数据生成，仅用于自我观察与记录参考，不构成医疗建议或疾病诊断。如有不适请咨询专业医生。";
export const AI_DISCLAIMER_EN =
  "This interpretation is generated from your recent anonymized statistics and is meant for self-observation only. It does not constitute medical advice or a diagnosis. Please consult a physician for any concerns.";

export function getDisclaimer(language: AILanguage): string {
  return language === "en" ? AI_DISCLAIMER_EN : AI_DISCLAIMER_ZH;
}

const SYSTEM_PROMPT_ZH = `你是一位女性健康记录助手，正在为用户生成"本月经期模式解读"。
严格遵守：
1. 只能基于输入的脱敏统计数据进行观察性描述，禁止诊断疾病、禁止推荐具体药物、禁止判断是否怀孕。
2. 语气温和、客观；强调"模式总结"而非"医疗结论"。
3. 必须以下列 JSON 结构返回，不要输出任何额外文本或 Markdown 代码块：
{"interpretation": "<150~220字的本月模式总结>", "highlights": ["<要点1>", "<要点2>", "<要点3>", "..."]}
4. highlights 给 3 到 5 条，每条 15~30 字，从稳定度/流量/症状/情绪/后续观察建议角度选。
5. 如果数据明显不足（cycleCount < 2），请在 interpretation 中明确提示"记录还不够，建议继续记录 X 个周期后再看解读"，highlights 给 3 条提示性建议即可。`;

const SYSTEM_PROMPT_EN = `You are a women's health logging assistant producing a "monthly cycle pattern summary".
Strict rules:
1. Only describe patterns based on the provided anonymized statistics. Never diagnose illness, recommend specific medication, or judge pregnancy status.
2. Keep the tone calm and observational; emphasize "pattern summary" rather than "medical conclusion".
3. Return ONLY the following JSON structure, with no extra prose or Markdown fences:
{"interpretation": "<120-180 words monthly pattern summary>", "highlights": ["<point1>", "<point2>", "<point3>", "..."]}
4. Provide 3 to 5 highlights, each 10-20 words, covering stability / flow / symptoms / mood / suggested observations.
5. If data is clearly insufficient (cycleCount < 2), state in the interpretation that more cycles should be logged before a meaningful reading, and give 3 gentle suggestions.`;

export function buildSystemPrompt(language: AILanguage): string {
  return language === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH;
}

export function buildUserPrompt(payload: AISanitizedPayload): string {
  const header =
    payload.language === "en"
      ? "Here is the user's anonymized monthly cycle statistics (JSON):"
      : "以下是用户本月的脱敏周期统计（JSON）：";
  return `${header}\n${JSON.stringify(payload, null, 2)}`;
}
