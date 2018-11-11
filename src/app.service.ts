import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  root(): string {
    return `
      <h1><a href="/">Youtube MP3/RSS API</a></h1>
      <div>
        <h3>API: </h3>
        <div>/channel/:id/rss.xml</div>
        <div>/v/:id/file.mp3</div>
      </div>
      <div>
        <h3>Examples: </h3>
      </div>
      <ul>
        <li><a href="/channel/UCgj0uCW9VR8p3PUJ91oDz9g/rss.xml">RSS for channel: /channel/UCgj0uCW9VR8p3PUJ91oDz9g/rss.xml</a></li>
        <li><a href="/v/K6Huy-xn7zw/file.mp3">MP3 for video: /v/K6Huy-xn7zw/file.mp3</a></li>
      </ul>
    `;
  }
}
