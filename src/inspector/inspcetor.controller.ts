import { Body, Controller, Post, Req, Res, Sse } from '@nestjs/common';
import { InspectorService } from './inspector.service';

@Controller('inspector')
export class InspectorController {
  constructor(private readonly inspectorService: InspectorService) {}

  @Post()
  async get_response(@Body('input') input: string) {
    return await this.inspectorService.generateResponse(input);
  }

  @Post('/pdd')
  async pdd_search(@Body('input') input: string) {
    return await this.inspectorService.pdd_search(input);
  }
}
