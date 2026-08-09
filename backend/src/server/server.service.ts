import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerService {
  getServerInfo() {
    return {
      name: 'InfraVision Server',
      status: 'online',
      message: 'Server API is working',
    };
  }
}
