import { Module } from "@nestjs/common";
import { ConsentController } from "./modules/consent/consent.controller";
import { ConsentService } from "./modules/consent/consent.service";
import { CycleController } from "./modules/cycle/cycle.controller";
import { CycleService } from "./modules/cycle/cycle.service";
import { HealthController } from "./modules/health/health.controller";
import { PrivacyController } from "./modules/privacy/privacy.controller";
import { PrivacyService } from "./modules/privacy/privacy.service";
import { ReminderController } from "./modules/reminders/reminder.controller";
import { ReminderService } from "./modules/reminders/reminder.service";
import { TelemetryController } from "./modules/telemetry/telemetry.controller";
import { TelemetryService } from "./modules/telemetry/telemetry.service";
import { InMemoryStoreService } from "./store/in-memory-store.service";

@Module({
  imports: [],
  controllers: [
    HealthController,
    CycleController,
    ReminderController,
    ConsentController,
    PrivacyController,
    TelemetryController
  ],
  providers: [
    InMemoryStoreService,
    CycleService,
    ReminderService,
    ConsentService,
    PrivacyService,
    TelemetryService
  ]
})
export class AppModule {}

