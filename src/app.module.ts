import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { YoutubeMp3Module } from './youtube-mp3-js/youtube-mp3.module';

@Module({
  imports: [YoutubeMp3Module],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
