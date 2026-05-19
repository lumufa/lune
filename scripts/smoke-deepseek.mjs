// Smoke test: confirm DeepSeek API key works and returns expected JSON shape.
// Run: node --env-file=.env.local scripts/smoke-deepseek.mjs

const endpoint = process.env.LLM_ENDPOINT;
const apiKey = process.env.LLM_API_KEY;
const model = process.env.LLM_MODEL ?? 'deepseek-chat';

if (!endpoint || !apiKey) {
  console.error('Missing LLM_ENDPOINT or LLM_API_KEY in env. Did you load .env.local?');
  process.exit(1);
}

const body = {
  model,
  messages: [
    { role: 'system', content: 'You are a women\'s health assistant. Reply in Chinese, JSON only.' },
    {
      role: 'user',
      content:
        '基于这段脱敏数据生成模式总结，严格按 {"interpretation": "...", "highlights": ["..."]} 返回:\n' +
        JSON.stringify({
          cycleCount: 6,
          averageCycleLength: 29,
          averagePeriodLength: 5,
          cycleVariability: 'stable',
          flowDistribution: { light: 33, medium: 50, heavy: 17 },
          topSymptoms: ['cramp', 'fatigue'],
          topMoods: ['calm', 'irritable'],
          predictionStatus: 'reliable',
          language: 'zh'
        })
    }
  ],
  temperature: 0.4,
  response_format: { type: 'json_object' }
};

const t0 = Date.now();
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 30_000);

try {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
    signal: controller.signal
  });

  const elapsed = Date.now() - t0;

  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status} after ${elapsed}ms`);
    console.error(text.slice(0, 500));
    process.exit(2);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const usage = data.usage ?? {};

  console.log(`[OK] ${elapsed}ms  model=${data.model}  tokens=${usage.prompt_tokens ?? '?'}+${usage.completion_tokens ?? '?'}`);
  console.log('---');
  console.log(content);
  console.log('---');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('WARN: model returned non-JSON content');
    process.exit(3);
  }
  if (!parsed.interpretation || !Array.isArray(parsed.highlights)) {
    console.error('WARN: missing interpretation or highlights field');
    process.exit(4);
  }
  console.log(`[SHAPE OK] interpretation=${parsed.interpretation.length}chars  highlights=${parsed.highlights.length}`);
} catch (error) {
  console.error('FAIL:', error.message);
  process.exit(5);
} finally {
  clearTimeout(timer);
}
