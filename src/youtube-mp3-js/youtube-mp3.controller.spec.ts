import { Test, TestingModule } from '@nestjs/testing';
import { YoutubeMp3Controller } from './youtube-mp3.controller';
import { YoutubeMp3Service } from './youtube-mp3.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [YoutubeMp3Controller],
      providers: [YoutubeMp3Service],
    }).compile();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      const appController = app.get<YoutubeMp3Controller>(YoutubeMp3Controller);
      expect(appController.root()).toBe('Hello World!');
    });
  });
});
