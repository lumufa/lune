import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { METRIC_EVENT_NAMES, MetricEvent, MetricEventName } from "@women-period/shared";
import { InMemoryStoreService } from "../../store/in-memory-store.service";

@Injectable()
export class TelemetryService {
  constructor(private readonly store: InMemoryStoreService) {}

  captureEvent(
    userId: string,
    name: MetricEventName,
    context?: Record<string, string | number | boolean>
  ): MetricEvent {
    if (!METRIC_EVENT_NAMES.includes(name)) {
      throw new Error(`metric ${name} is not supported`);
    }

    const event: MetricEvent = {
      id: randomUUID(),
      userId,
      name,
      context,
      occurredAt: new Date().toISOString()
    };
    const events = this.store.listTelemetry(userId);
    events.push(event);
    this.store.saveTelemetry(userId, events);
    return event;
  }
}
