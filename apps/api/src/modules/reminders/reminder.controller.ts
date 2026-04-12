import { Body, Controller, Get, Headers, Put } from "@nestjs/common";
import { ReminderPreference } from "@women-period/shared";
import { requireUserId } from "../../common/request-user";
import { ReminderService } from "./reminder.service";

@Controller("reminders/preferences")
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Get()
  getPreferences(@Headers("x-user-id") userId?: string) {
    return this.reminderService.getPreferences(requireUserId(userId));
  }

  @Put()
  updatePreferences(
    @Headers("x-user-id") userId: string | undefined,
    @Body() payload: ReminderPreference
  ) {
    return this.reminderService.updatePreferences(requireUserId(userId), payload);
  }
}

