import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { ConsentType } from "@women-period/shared";
import { requireUserId } from "../../common/request-user";
import { ConsentService } from "./consent.service";

interface GrantConsentPayload {
  type: ConsentType;
  version: string;
  purpose: string;
}

@Controller("consents")
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get()
  listConsents(@Headers("x-user-id") userId?: string) {
    return this.consentService.listConsents(requireUserId(userId));
  }

  @Post()
  grantConsent(
    @Headers("x-user-id") userId: string | undefined,
    @Body() payload: GrantConsentPayload
  ) {
    return this.consentService.grantConsent(requireUserId(userId), payload);
  }

  @Post(":id/withdraw")
  withdrawConsent(@Headers("x-user-id") userId: string | undefined, @Param("id") id: string) {
    return this.consentService.withdrawConsent(requireUserId(userId), id);
  }
}

