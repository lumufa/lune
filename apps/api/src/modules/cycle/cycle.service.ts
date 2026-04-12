import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { buildCycleSummary, buildPredictionSnapshot } from "@women-period/prediction";
import { CycleDashboard, CycleRecord, CycleRecordInput } from "@women-period/shared";
import { validateCycleRecordInput } from "../../common/validators";
import { InMemoryStoreService } from "../../store/in-memory-store.service";

@Injectable()
export class CycleService {
  constructor(private readonly store: InMemoryStoreService) {}

  getDashboard(userId: string): CycleDashboard {
    const records = this.listSorted(userId);
    return {
      records,
      summary: buildCycleSummary(records),
      prediction: buildPredictionSnapshot(userId, records)
    };
  }

  createRecord(userId: string, input: CycleRecordInput): CycleDashboard {
    validateCycleRecordInput(input);
    const now = new Date().toISOString();
    const nextRecord: CycleRecord = {
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
      ...input
    };
    const records = this.listSorted(userId);
    records.push(nextRecord);
    this.store.saveCycles(userId, records);
    return this.getDashboard(userId);
  }

  updateRecord(userId: string, id: string, input: Partial<CycleRecordInput>): CycleDashboard {
    const records = this.listSorted(userId);
    const index = records.findIndex((record) => record.id === id);

    if (index < 0) {
      throw new NotFoundException(`cycle record ${id} not found`);
    }

    const updatedRecord: CycleRecord = {
      ...records[index],
      ...input,
      updatedAt: new Date().toISOString()
    };
    validateCycleRecordInput(updatedRecord);
    records[index] = updatedRecord;
    this.store.saveCycles(userId, records);
    return this.getDashboard(userId);
  }

  deleteRecord(userId: string, id: string): CycleDashboard {
    const records = this.listSorted(userId).filter((record) => record.id !== id);
    this.store.saveCycles(userId, records);
    return this.getDashboard(userId);
  }

  private listSorted(userId: string): CycleRecord[] {
    return this.store
      .listCycles(userId)
      .sort((left, right) => left.startDate.localeCompare(right.startDate));
  }
}

