import { HttpService, Injectable } from '@nestjs/common';
import * as ytdl from 'ytdl-core';
import * as ffmpeg from 'fluent-ffmpeg';
import * as RSS from 'rss';
import { Request, Response } from 'express';
import * as Parser from 'rss-parser';
import stream from './stream';

@Injectable()
export class YoutubeMp3Service {
  constructor(private readonly httpService: HttpService) {}

  async getRss(id, request: Request) {
    const parser = new Parser({
      customFields: {
        item: ['media:group'],
      },
    });
    const feed = await parser.parseURL(
      'https://www.youtube.com/feeds/videos.xml?channel_id=' + id,
    );
    const rss = new RSS({
      title: feed.title,
      site_url: feed.link,
      generator: ' ',
      feed_url:
        request.protocol + '://' + request.get('host') + request.originalUrl,
    });

    feed.items.map(item => {
      const itemId = item.link.split('=')[1];
      rss.item({
        title: item.title,
        description: item['media:group']['media:description'][0],
        author: item.author,
        date: item.pubDate,
        url: item.link,
        custom_elements: [
          {
            link: {
              _attr: {
                rel: 'alternate',
                href: `${request.protocol +
                  '://' +
                  request.get('host')}/v/${itemId}/file.mp3`,
              },
            },
          },
        ],
        enclosure: {
          url: `${request.protocol +
            '://' +
            request.get('host')}/v/${itemId}/file.mp3`,
          type: 'audio/mpeg',
        },
      });
    });
    return rss.xml();
  }

  /**
   * The algorithm from https://github.com/iSolutionJA/youtube-audio is used here
   */
  async streamYoutubeMiddleware(
    requestUrl: string,
    response: Response,
    request: Request,
  ) {
    await ytdl.getInfo(requestUrl, (err, info) => {
      const duration: number = parseInt(info.length_seconds, 10);
      if (duration === 0) {
        if (err) return console.log(err);
        const liveStreamURL = ytdl(requestUrl);
        ffmpeg(liveStreamURL)
          .audioCodec('libmp3lame')
          .format('mp3')
          .on('error', suberr => {
            console.log('ffmpeg error:', suberr.message);
          })
          .audioBitrate(128)
          .pipe(response);
      } else {
        const contentType = 'audio/mpeg';
        // calculate length in bytes, (((bitrate * (lengthInSeconds)) / bitsToKiloBytes) * kiloBytesToBytes)
        // using 125 instead of 128 because it is more accurate
        const durationInBytes = ((125 * duration) / 8) * 1024;
        if (request.headers.range) {
          const range = request.headers.range as string;
          const parts = range.replace(/bytes=/, '').split('-');
          const partialstart = parts[0];
          const partialend = parts[1];

          const start = parseInt(partialstart, 10);
          const end = partialend
            ? parseInt(partialend, 10)
            : durationInBytes - 1;

          const chunksize = end - start + 1;
          response.writeHead(206, {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Range':
              'bytes ' + start + '-' + end + '/' + durationInBytes,
          });

          // convert start in bytes to start in seconds
          // minus one second to prevent content length error
          const startInSeconds = (start / (1024 * 125)) * 8 - 1;
          const streamObj = stream(requestUrl, {}, startInSeconds);
          streamObj.stream.pipe(response);
        } else {
          response.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': durationInBytes,
            'Transfer-Encoding': 'chuncked',
          });
          const streamObj = stream(requestUrl);
          streamObj.stream.pipe(response);
        }
      }
    });
  }
}
