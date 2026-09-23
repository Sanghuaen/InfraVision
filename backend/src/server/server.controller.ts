import { Body, Controller, Get, Param, Post, } from '@nestjs/common';
import { ServerService } from './server.service';
import { MetricsDto } from './dto/metrics.dto';

@Controller('servers')
export class ServerController {
  constructor(
    private readonly serverService: ServerService,
  ) { }


  @Get()
  getAllServers() {
    return this.serverService.getAllServers();
  }

  @Get('summary')
  getDashboardSummary() {
    return this.serverService.getDashboardSummary();
  }

  @Get(':id/metrics/latest')
  getLatestMetric(
    @Param('id') id: string,
  ) {
    return this.serverService.getLatestMetric(id);
  }


  @Get(':id/metrics')
  getServerMetrics(
    @Param('id') id: string,
  ) {
    return this.serverService.getServerMetrics(id);
  }



  @Get(':id')
  getServerByAgentId(
    @Param('id') id: string,
  ) {
    return this.serverService.getServerByAgentId(id);
  }

  @Post(':id/metrics')
  receiveMetrics(
    @Param('id') id: string,
    @Body() data: MetricsDto,
  ) {
    return this.serverService.receiveMetrics(id, data);
  }
}