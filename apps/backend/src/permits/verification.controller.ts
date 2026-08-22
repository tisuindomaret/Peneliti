import { Controller, Get, Param } from '@nestjs/common';
import { PermitsService } from './permits.service';

@Controller('api/v1/verify')
export class VerificationController {
  constructor(private readonly permitsService: PermitsService) {}

  // This static prefix must precede the generic :permit_number route; otherwise
  // `/verify/token/<token>` is interpreted as permit number `token`.
  @Get('token/:verification_token')
  async verifyByToken(
    @Param('verification_token') verificationToken: string,
  ): Promise<Record<string, unknown>> {
    return this.permitsService.verifyByToken(verificationToken);
  }

  @Get(':permit_number')
  async verifyByNumber(
    @Param('permit_number') permitNumber: string,
  ): Promise<Record<string, unknown>> {
    return this.permitsService.verifyByNumber(permitNumber);
  }
}
