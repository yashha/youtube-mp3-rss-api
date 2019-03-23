import { Get, Controller, Res, Req, Param } from '@nestjs/common';
import { Request, Response } from 'express';

import { YoutubeMp3Service } from './youtube-mp3.service';

@Controller()
export class YoutubeMp3Controller {
  constructor(private readonly youtubeMp3Service: YoutubeMp3Service) {}

  @Get('channel/:id/rss.xml')
  async rss(
    @Res() response: Response,
    @Req() request: Request,
    @Param('id') id,
  ) {
    response.set('Content-Type', 'text/xml');
    const xml = await this.youtubeMp3Service.getRss(id, request);
    response.send(xml);
  }

  @Get('v/:id/file.mp3')
  async mp3(@Res() response, @Req() request, @Param('id') id): Promise<void> {
    const requestUrl = 'https://www.youtube.com/watch?v=' + id;

    await this.youtubeMp3Service.streamYoutubeMiddleware(
      requestUrl,
      response,
      request,
    );
  }
}
