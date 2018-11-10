import { HttpService, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as ytdl from 'ytdl-core';
import * as ffmpeg from 'fluent-ffmpeg';
import * as RSS from 'rss';
import * as fs from 'fs';
import filenamify from 'filenamify';
import { Request, Response } from 'express';
import * as Parser from 'rss-parser';
import stream from './stream';

const basePath = path.resolve(__dirname + '/../../cache');

@Injectable()
export class YoutubeMp3Service {
  constructor(private readonly httpService: HttpService) {}

  async download(url: string, res: Response): Promise<string> {
    const file = path.resolve(basePath, filenamify(url) + '.mp3');
    if (fs.existsSync(file)) {
      return file;
    }
    const stream = ytdl(url);

    res.contentType('mp3');
    return new Promise<string>(resolve => {
      ffmpeg(stream)
        .withAudioCodec('libmp3lame')
        .format('mp3')
        .audioBitrate(64)
        .on('error', function(err, stdout, stderr) {
          console.log('an error happened: ' + err.message);
          console.log('ffmpeg stdout: ' + stdout);
          console.log('ffmpeg stderr: ' + stderr);
        })
        .on('end', function() {
          console.log('Processing finished !');
        })
        .on('progress', function(progress) {
          console.log('Streaming at ' + progress.timemark);
        })
        .pipe(
          res,
          { end: false },
        );
    });
  }

  deleteFilesOlderThan(directory: string, time: number) {
    fs.readdir(directory, function(err, files) {
      files.forEach(function(file, index) {
        fs.stat(path.join(directory, file), function(err, stat) {
          if (err) {
            return console.error(err);
          }
          const now = new Date().getTime();
          const endTime = new Date(stat.ctime).getTime() + time;
          if (now > endTime) {
            return fs.unlinkSync(path.join(directory, file));
          }
        });
      });
    });
  }

  cleanupOld() {
    this.deleteFilesOlderThan(basePath, 60 * 60 * 1000);
  }

  async getRss(id, request) {
    let parser = new Parser({
      customFields: {
        item: ['media:group'],
      },
    });
    let feed = await parser.parseURL(
      'https://www.youtube.com/feeds/videos.xml?channel_id=' + id,
    );
    let rss = new RSS({
      title: feed.title,
      site_url: feed.link,
      generator: ' ',
      feed_url:
        request.protocol + '://' + request.get('host') + request.originalUrl,
    });

    feed.items.map(item => {
      const id = item.link.split('=')[1];
      rss.item({
        title: item.title,
        description: item['media:group']['media:description'][0],
        author: item['author'],
        date: item.pubDate,
        url: item.link,
        custom_elements: [
          {
            link: {
              _attr: {
                rel: 'alternate',
                href: `http://localhost:3000/v/${id}/file.mp3`,
              },
            },
          },
        ],
        enclosure: {
          url: `http://localhost:3000/v/${id}/file.mp3`,
          type: 'audio/mpeg',
        },
      });
    });
    return rss.xml();
  }

  async streamYoutubeMiddleware(
    requestUrl: string,
    response: Response,
    request: Request,
  ) {
    await ytdl.getInfo(requestUrl, (err, info) => {
      const duration: number = parseInt(info.length_seconds);
      if (duration === 0) {
        if (err) return console.log(err);
        let liveStreamURL = ytdl(requestUrl);
        ffmpeg(liveStreamURL)
          .audioCodec('libmp3lame')
          .format('mp3')
          .on('error', err => {
            console.log('ffmpeg error:', err.message);
          })
          .audioBitrate(128)
          .pipe(response);
      } else {
        let contentType = 'audio/mpeg';
        // calculate length in bytes, (((bitrate * (lengthInSeconds)) / bitsToKiloBytes) * kiloBytesToBytes)
        // using 125 instead of 128 because it is more accurate
        let durationInBytes = ((125 * duration) / 8) * 1024;
        if (request.headers.range) {
          let range = <string>request.headers.range;
          let parts = range.replace(/bytes=/, '').split('-');
          let partialstart = parts[0];
          let partialend = parts[1];

          let start = parseInt(partialstart, 10);
          let end = partialend ? parseInt(partialend, 10) : durationInBytes - 1;

          let chunksize = end - start + 1;
          response.writeHead(206, {
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Range':
              'bytes ' + start + '-' + end + '/' + durationInBytes,
          });

          // convert start in bytes to start in seconds
          // minus one second to prevent content length error
          let startInSeconds = (start / (1024 * 125)) * 8 - 1;
          let streamObj = stream(requestUrl, {}, startInSeconds);
          streamObj.stream.pipe(response);
        } else {
          response.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': durationInBytes,
            'Transfer-Encoding': 'chuncked',
          });
          let streamObj = stream(requestUrl);
          streamObj.stream.pipe(response);
        }
      }
    });
  }
}
