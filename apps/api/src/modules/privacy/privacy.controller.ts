import { Controller, Get, Headers, Post } from "@nestjs/common";
import { requireUserId } from "../../common/request-user";
import { PrivacyService } from "./privacy.service";

@Controller("privacy")
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get("export")
  exportData(@Headers("x-user-id") userId?: string) {
    return this.privacyService.exportData(requireUserId(userId));
  }

  @Get("actions")
  listActions(@Headers("x-user-id") userId?: string) {
    return this.privacyService.listActions(requireUserId(userId));
  }

  @Post("delete")
  deleteAccount(@Headers("x-user-id") userId?: string) {
    return this.privacyService.deleteAccount(requireUserId(userId));
  }
}

