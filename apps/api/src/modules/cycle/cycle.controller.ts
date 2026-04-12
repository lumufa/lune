import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post
} from "@nestjs/common";
import { CycleRecordInput } from "@women-period/shared";
import { requireUserId } from "../../common/request-user";
import { CycleService } from "./cycle.service";

@Controller("cycles")
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @Get()
  getDashboard(@Headers("x-user-id") userId?: string) {
    return this.cycleService.getDashboard(requireUserId(userId));
  }

  @Post()
  createRecord(
    @Headers("x-user-id") userId: string | undefined,
    @Body() payload: CycleRecordInput
  ) {
    return this.cycleService.createRecord(requireUserId(userId), payload);
  }

  @Patch(":id")
  updateRecord(
    @Headers("x-user-id") userId: string | undefined,
    @Param("id") id: string,
    @Body() payload: Partial<CycleRecordInput>
  ) {
    return this.cycleService.updateRecord(requireUserId(userId), id, payload);
  }

  @Delete(":id")
  deleteRecord(@Headers("x-user-id") userId: string | undefined, @Param("id") id: string) {
    return this.cycleService.deleteRecord(requireUserId(userId), id);
  }
}

