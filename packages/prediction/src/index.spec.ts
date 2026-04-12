import { describe, expect, it } from "vitest";
import { CycleRecord } from "@women-period/shared";
import { buildCycleSummary, buildPredictionSnapshot } from "./index";

function record(id: string, startDate: string, endDate: string): CycleRecord {
  const timestamp = `${startDate}T00:00:00.000Z`;
  return {
    id,
    userId: "user-1",
    startDate,
    endDate,
    flowLevel: "medium",
    painLevel: 1,
    symptoms: ["cramps"],
    mood: "steady",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

describe("buildCycleSummary", () => {
  it("uses defaults when only one record exists", () => {
    const summary = buildCycleSummary([record("1", "2026-02-01", "2026-02-05")]);

    expect(summary.averageCycleLength).toBe(28);
    expect(summary.averagePeriodLength).toBe(5);
  });
});

describe("buildPredictionSnapshot", () => {
  it("creates a stable prediction when records are consistent", () => {
    const prediction = buildPredictionSnapshot("user-1", [
      record("1", "2026-01-01", "2026-01-05"),
      record("2", "2026-01-29", "2026-02-02"),
      record("3", "2026-02-26", "2026-03-02")
    ]);

    expect(prediction.status).toBe("stable");
    expect(prediction.predictedCycleLength).toBe(28);
    expect(prediction.predictedStartDate).toBe("2026-03-26");
  });

  it("widens the confidence window for irregular cycles", () => {
    const prediction = buildPredictionSnapshot("user-1", [
      record("1", "2026-01-01", "2026-01-05"),
      record("2", "2026-01-31", "2026-02-04"),
      record("3", "2026-03-05", "2026-03-09")
    ]);

    expect(prediction.status).toBe("estimated");
    expect(prediction.confidence).toBeLessThan(0.8);
  });
});
