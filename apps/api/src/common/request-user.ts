import { BadRequestException } from "@nestjs/common";

export function requireUserId(userId?: string): string {
  if (!userId || userId.trim().length === 0) {
    throw new BadRequestException("x-user-id header is required");
  }

  return userId.trim();
}

