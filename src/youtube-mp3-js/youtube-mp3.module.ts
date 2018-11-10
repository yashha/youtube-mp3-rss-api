import { HttpModule, Module } from '@nestjs/common';
import { YoutubeMp3Controller } from './youtube-mp3.controller';
import { YoutubeMp3Service } from './youtube-mp3.service';

@Module({
  imports: [HttpModule],
  controllers: [YoutubeMp3Controller],
  providers: [YoutubeMp3Service],
})
export class YoutubeMp3Module {}
