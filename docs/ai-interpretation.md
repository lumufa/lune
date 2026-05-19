# AI 月度解读（ai_monthly_interpretation）

## 用途
为用户生成"本月经期模式解读"，作为项目跨端 AI 能力的第一项实验。严格定位为**模式总结**，非医疗建议、非疾病诊断。

## 数据流

```
miniapp (insights 页)
   │  POST /cycles/ai-interpretation  { language }
   ▼
apps/api  AIInterpretationController
   │  assertConsent(userId, "ai_monthly_interpretation")
   │  cycleService.getDashboard(userId)
   │  buildSanitizedPayload(dashboard)   ← 白名单脱敏
   ▼
第三方 LLM (豆包 / 通义 / 智谱)
   │  JSON mode
   ▼
AIInterpretationSnapshot  { interpretation, highlights, disclaimer, modelProvider }
```

## 隐私脱敏白名单（硬约束）

发送给 LLM 的 JSON **只允许包含**下列字段（见 `AISanitizedPayload`）：

| 字段 | 来源 |
| --- | --- |
| `cycleCount` | `summary.recordCount` |
| `averageCycleLength` | `summary.averageCycleLength` |
| `averagePeriodLength` | `summary.averagePeriodLength` |
| `cycleVariability` | `prediction.cycleVariability` |
| `flowDistribution` | 自算（light/medium/heavy 百分比） |
| `topSymptoms` | 出现频次前 3 的 SymptomTag（`none` 除外） |
| `topMoods` | 出现频次前 2 的 MoodTag |
| `predictionStatus` | `prediction.status` |
| `language` | 调用方传入 |

**严禁发送**：`record.note` 自由文本、`userId`、任何精确日期（`startDate` / `endDate`）、性生活与生育相关字段、clinical history。

新增字段必须同步更新本文与 [ai-interpretation.service.ts](../apps/api/src/modules/ai/ai-interpretation.service.ts) 的 `buildSanitizedPayload`。

## Consent

| scope | 首次授权版本 |
| --- | --- |
| `ai_monthly_interpretation` | `2026-04-24` |

- 小程序端首次点击"生成解读"按钮时弹出 `wx.showModal` → 用户确认后写入 consent 再调 API
- 用户可在隐私中心通过现有 `withdrawConsent` 撤回（现有机制，不新增 UI）
- 后端在 `service.interpretMonthly` 开头做 `assertConsent`，未授权返回 403

## 环境变量

见 [.env.example](../.env.example)。缺失时 API 启动仅 warn，端点返回 503 `AI interpretation service is not configured`，前端显示"该环境未配置 AI 服务"。

## 约束与策略

- **超时**：15s，硬超时
- **重试**：仅对 429 / 5xx 重试 1 次
- **模型响应格式**：`response_format: { type: "json_object" }`；Prompt 强制返回 `{interpretation, highlights[]}`
- **非流式**：第一版使用非流式返回，简化状态机（流式留作 v2）

## 面试可讲点

1. **隐私脱敏白名单** 设计与 `buildSanitizedPayload` 的纯函数可测性
2. **独立 consent scope** 的必要性（与既有 `sensitive_health_data` 分离，可单独撤回）
3. **Prompt 约束**："模式总结非医疗建议"如何写进 system prompt
4. **错误分层**：403（未授权）/ 502（上游异常）/ 503（未配置）/ network 各自对应前端提示
5. **选型权衡**：国内厂商 vs 海外（合规 / 延迟 / 白名单），非流式 vs 流式（状态机复杂度 / 体感延迟）
