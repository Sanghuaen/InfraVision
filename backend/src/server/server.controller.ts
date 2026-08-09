import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { ServerService } from './server.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('servers')
export class ServerController {
  constructor(
    private readonly serverService: ServerService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getServerInfo() {
    return this.serverService.getServerInfo();
  }
}