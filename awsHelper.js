const bluebird = require('bluebird')
const aws = require('aws-sdk')
const config = { region: 'us-east-1' }
const comprehend = bluebird.promisifyAll(new aws.Comprehend(config))
// to avoid
const polly = bluebird.promisifyAll(new aws.Polly(config))
const fs = bluebird.promisifyAll(require('fs'))

const MAX_STRING_LENGTH = 4800 // It's 5000 bytes but that's ok
const cleanText = text => text.slice(0, MAX_STRING_LENGTH)

const getEntities = text => {
  const Text = cleanText(text)
  const LanguageCode = 'en'
  return comprehend.detectEntitiesAsync({ Text, LanguageCode })
}

const saveSpeech = ({ AudioStream }) => {
  const fileName = './audios/' + new Date().getTime() + '.mp3'
  return fs.writeFileAsync(fileName, AudioStream)
    .then(() => fileName)
}

const getSpeech = text => {
  const Text = cleanText(text)
  const OutputFormat = 'mp3'
  const VoiceId = 'Kimberly'
  const params = { Text, OutputFormat, VoiceId }
  return polly.synthesizeSpeechAsync(params)
}

const saveSpeechLocally = text => getSpeech(text).then(saveSpeech)

module.exports = {
  getEntities,
  saveSpeechLocally
}


/*
create from single image and audio
https://superuser.com/questions/1041816/combine-one-image-one-audio-file-to-make-one-video-using-ffmpeg
rm -rf out.mp4
ffmpeg -loop 1 -i shot.png -i speech.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest out.mp4
open out.mp4


Create video from single image
https://stackoverflow.com/questions/25891342/creating-a-video-from-a-single-image-for-a-specific-duration-in-ffmpeg

ffmpeg -loop 1 -i image.png -c:v libx264 -t 15 -pix_fmt yuv420p -vf scale=320:240 out.mp4

from several images

ffmpeg -f concat -safe 0 -i v.txt -vsync vfr -pix_fmt yuv420p o.mp4


rm -rf out.mp4; ffmpeg -loop 1 -i shot.png -c:v libx264 -t 15 -pix_fmt yuv420p out.mp4


*/
