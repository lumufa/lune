import { Body, Controller, Headers, Post } from "@nestjs/common";
import { MetricEventName } from "@women-period/shared";
import { requireUserId } from "../../common/request-user";
import { TelemetryService } from "./telemetry.service";

interface CaptureMetricPayload {
  name: MetricEventName;
  context?: Record<string, string | number | boolean>;
}

@Controller("telemetry/events")
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  captureEvent(
    @Headers("x-user-id") userId: string | undefined,
    @Body() payload: CaptureMetricPayload
  ) {
    return this.telemetryService.captureEvent(requireUserId(userId), payload.name, payload.context);
  }
}

