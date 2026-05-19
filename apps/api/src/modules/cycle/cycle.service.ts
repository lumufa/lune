import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
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
    const records = this.listSorted(userId);
    if (this.hasOverlap(records, input.startDate, input.endDate)) {
      throw new ConflictException("该日期与已有周期记录重叠");
    }
    const now = new Date().toISOString();
    const nextRecord: CycleRecord = {
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
      ...input
    };
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
    if (this.hasOverlap(records, updatedRecord.startDate, updatedRecord.endDate, id)) {
      throw new ConflictException("该日期与已有周期记录重叠");
    }
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

  private hasOverlap(records: CycleRecord[], startDate: string, endDate: string, excludeId?: string): boolean {
    return records.some((record) => {
      if (excludeId && record.id === excludeId) return false;
      return record.startDate <= endDate && record.endDate >= startDate;
    });
  }
}

