import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ConsentRecord, ConsentType } from "@women-period/shared";
import { InMemoryStoreService } from "../../store/in-memory-store.service";

interface GrantConsentPayload {
  type: ConsentType;
  version: string;
  purpose: string;
}

@Injectable()
export class ConsentService {
  constructor(private readonly store: InMemoryStoreService) {}

  listConsents(userId: string): ConsentRecord[] {
    return this.store.listConsents(userId).sort((left, right) => left.grantedAt.localeCompare(right.grantedAt));
  }

  grantConsent(userId: string, payload: GrantConsentPayload): ConsentRecord {
    const record: ConsentRecord = {
      id: randomUUID(),
      userId,
      type: payload.type,
      version: payload.version,
      purpose: payload.purpose,
      status: "granted",
      grantedAt: new Date().toISOString()
    };
    const consents = this.store.listConsents(userId);
    consents.push(record);
    this.store.saveConsents(userId, consents);
    return record;
  }

  withdrawConsent(userId: string, id: string): ConsentRecord {
    const consents = this.store.listConsents(userId);
    const index = consents.findIndex((record) => record.id === id);

    if (index < 0) {
      throw new NotFoundException(`consent ${id} not found`);
    }

    const withdrawnRecord: ConsentRecord = {
      ...consents[index],
      status: "withdrawn",
      withdrawnAt: new Date().toISOString()
    };
    consents[index] = withdrawnRecord;
    this.store.saveConsents(userId, consents);
    return withdrawnRecord;
  }
}

