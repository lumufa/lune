const demoUserId = "demo-user-cn";
const baseUrl = process.env.API_BASE_URL || "http://127.0.0.1:3000";

async function request(path, method, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-user-id": demoUserId
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  await request("/consents", "POST", {
    type: "privacy_policy",
    version: "2026.03",
    purpose: "展示隐私政策与用户协议"
  });

  await request("/consents", "POST", {
    type: "sensitive_health_data",
    version: "2026.03",
    purpose: "记录经期与症状数据，用于生成周期预测"
  });

  const records = [
    {
      startDate: "2026-01-03",
      endDate: "2026-01-07",
      flowLevel: "medium",
      painLevel: 1,
      symptoms: ["cramps", "fatigue"],
      mood: "steady",
      note: "第一天略疲惫。"
    },
    {
      startDate: "2026-01-31",
      endDate: "2026-02-04",
      flowLevel: "medium",
      painLevel: 2,
      symptoms: ["cramps", "bloating"],
      mood: "tired",
      note: "午后容易腹胀。"
    },
    {
      startDate: "2026-02-28",
      endDate: "2026-03-03",
      flowLevel: "light",
      painLevel: 1,
      symptoms: ["back_pain"],
      mood: "steady",
      note: "整体比上次轻。"
    }
  ];

  for (const record of records) {
    await request("/cycles", "POST", record);
  }

  await request("/reminders/preferences", "PUT", {
    userId: demoUserId,
    timezone: "Asia/Shanghai",
    quietHours: {
      start: "22:30",
      end: "08:00"
    },
    items: [
      { type: "period_due", enabled: true, leadDays: 2, time: "09:00" },
      { type: "delayed", enabled: true, leadDays: 3, time: "10:00" },
      { type: "logging_gap", enabled: false, leadDays: 7, time: "19:30" }
    ],
    updatedAt: new Date().toISOString()
  });

  await request("/telemetry/events", "POST", {
    name: "onboarding_complete",
    context: {
      source: "seed-script"
    }
  });

  const dashboard = await request("/cycles", "GET");
  console.log(JSON.stringify(dashboard, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
