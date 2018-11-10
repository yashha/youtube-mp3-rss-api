// Custom youtube-audio-stream with bitrate, start time option and reference to ffmpeg process
import * as ytdl from 'ytdl-core';
import * as FFmpeg from 'fluent-ffmpeg';
import * as through from 'through2';
import * as xtend from 'xtend';
import * as fs from 'fs';

export default function streamify(uri, opt?, startTimeInSeconds?) {
  opt = xtend({
    videoFormat: 'mp4',
    quality: 'lowest',
    audioFormat: 'mp3',
    filter: filterVideo,
    applyOptions: function () { }
  }, opt);

  var video = ytdl(uri, opt);

  function filterVideo(format) {
    return (
      format.container === opt.videoFormat &&
      format.audioEncoding
    );
  }

  var stream = opt.file
    ? fs.createWriteStream(opt.file)
    : through();

  var ffmpeg = FFmpeg(video);
  opt.applyOptions(ffmpeg);
  var output;
  if (startTimeInSeconds) {
    output = ffmpeg
      .setStartTime(startTimeInSeconds)
      .audioBitrate(128)
      .format(opt.audioFormat)
      .pipe(stream);
  } else {
    output = ffmpeg
      .audioBitrate(128)
      .format(opt.audioFormat)
      .pipe(stream);
  }
  video.on('info', stream.emit.bind(stream, 'info'));
  // output.on('error', video.end.bind(video));
  output.on('error', stream.emit.bind(stream, 'error'));
  return {
    stream: stream,
    ffmpeg: ffmpeg
  };
}
