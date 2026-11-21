import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServerService {
  constructor(private readonly prisma: PrismaService) { }

  async getServerByAgentId(agentId: string) {
    const server = await this.prisma.server.findUnique({
      where: {
        agentId,
      },
    });

    if (!server) {
      throw new NotFoundException(
        `Server with agentId "${agentId}" not found`,
      );
    }

    return server;
  }

  async getAllServers() {
    return this.prisma.server.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async receiveMetrics(agentId: string, data: any) {
    const server = await this.prisma.server.findUnique({
      where: {
        agentId,
      },
    });

    if (!server) {
      throw new NotFoundException(
        `Server with agentId "${agentId}" not found`,
      );
    }


    const metric = await this.prisma.metric.create({
      data: {
        serverId: server.id,

        cpu: data.cpu ?? {},
        memory: data.memory ?? {},
        disk: data.disk ?? {},
        network: data.network ?? [],
        processes: data.processes ?? [],
        docker: data.docker ?? [],

        collectedAt: data.agent?.timestamp
          ? new Date(data.agent.timestamp)
          : new Date(),
      },
    });

    // Save Windows Event Logs
    if (Array.isArray(data.logs) && data.logs.length > 0) {
      await this.prisma.log.createMany({
        data: data.logs.map((log: any) => ({
          serverId: server.id,
          recordId: log.recordId,
          timestamp: new Date(log.timestamp),
          level: log.level,
          source: log.source,
          eventId: log.eventId,
          channel: log.channel,
          message: log.message,
        })),
        skipDuplicates: true,
      });
    }


    return {
      success: true,
      serverId: server.id,
      agentId: server.agentId,
      metricId: metric.id,
      collectedAt: metric.collectedAt,
    };
  }

  async getServerMetrics(agentId: string) {
    const server = await this.prisma.server.findUnique({
      where: {
        agentId,
      },
    });

    if (!server) {
      throw new NotFoundException(
        `Server with agentId "${agentId}" not found`,
      );
    }

    return this.prisma.metric.findMany({
      where: {
        serverId: server.id,
      },
      orderBy: {
        collectedAt: 'desc',
      },
    });
  }

  async getLatestMetric(agentId: string) {
    const server = await this.prisma.server.findUnique({
      where: {
        agentId,
      },
    });

    if (!server) {
      throw new NotFoundException(
        `Server with agentId "${agentId}" not found`,
      );
    }

    const metric = await this.prisma.metric.findFirst({
      where: {
        serverId: server.id,
      },
      orderBy: {
        collectedAt: 'desc',
      },
    });

    if (!metric) {
      throw new NotFoundException(
        `No metrics found for server "${agentId}"`,
      );
    }

    return metric;
  }

  async getDashboardSummary() {
    const servers = await this.prisma.server.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summary = await Promise.all(
      servers.map(async (server) => {
        const metric = await this.prisma.metric.findFirst({
          where: {
            serverId: server.id,
          },
          orderBy: {
            collectedAt: 'desc',
          },
        });

        const cpu = (metric?.cpu ?? {}) as Record<string, any>;
        const memory = (metric?.memory ?? {}) as Record<string, any>;
        const disk = (metric?.disk ?? {}) as Record<string, any>;

        const processes = Array.isArray(metric?.processes)
          ? metric.processes
          : [];

        const docker = Array.isArray(metric?.docker)
          ? metric.docker
          : [];

        return {
          serverId: server.id,
          agentId: server.agentId,
          name: server.name,
          hostname: server.hostname,
          platform: server.platform,
          status: server.status,

          cpu: cpu.usage ?? 0,
          memory: memory.usage ?? 0,
          disk: disk.usage ?? 0,

          processCount: processes.length,
          dockerContainerCount: docker.length,

          collectedAt: metric?.collectedAt ?? null,
        };
      }),
    );

    return summary;
  }

  async getServerLogs(agentId: string) {
    const server = await this.prisma.server.findUnique({
      where: {
        agentId,
      },
    });

    if (!server) {
      throw new NotFoundException(
        `Server with agentId "${agentId}" not found`,
      );
    }

    return this.prisma.log.findMany({
      where: {
        serverId: server.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });
  }
}