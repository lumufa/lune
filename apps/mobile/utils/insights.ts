import type { CycleRecord, FlowLevel, MoodTag, PredictionSnapshot, SymptomTag } from "@/constants/shared";

export function buildFlowBreakdown(records: CycleRecord[]) {
  const counts: Record<FlowLevel, number> = {
    light: 0,
    medium: 0,
    heavy: 0
  };

  for (const record of records) {
    counts[record.flowLevel] += 1;
  }

  const total = records.length || 1;

  return (Object.keys(counts) as FlowLevel[]).map((key) => ({
    level: key,
    value: counts[key],
    percentage: (counts[key] / total) * 100
  }));
}

export function buildSymptomCorrelation(records: CycleRecord[]) {
  const symptomCounts = new Map<SymptomTag, number>();
  const moodCounts = new Map<MoodTag, number>();

  for (const record of records) {
    for (const symptom of record.symptoms) {
      if (symptom === "none") {
        continue;
      }
      symptomCounts.set(symptom, (symptomCounts.get(symptom) || 0) + 1);
    }

    moodCounts.set(record.mood, (moodCounts.get(record.mood) || 0) + 1);
  }

  const dominantSymptom =
    [...symptomCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || "none";
  const dominantMood = [...moodCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || "steady";

  return {
    symptom: dominantSymptom,
    mood: dominantMood,
    score: Math.round(Math.min(records.length / 5, 1) * 56)
  };
}

export function buildPredictabilityScore(prediction: PredictionSnapshot): number {
  return Math.max(0, Math.min(100, Math.round(prediction.confidence * 100)));
}

export function buildPredictabilityBars(records: CycleRecord[]): number[] {
  return records.slice(-6).map((record) => {
    const start = new Date(record.startDate);
    const end = new Date(record.endDate);
    const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return diff;
  });
}
