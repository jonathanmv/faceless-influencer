const bluebird = require('bluebird')
const aws = require('aws-sdk')
const config = { region: 'us-east-1' }
const comprehend = bluebird.promisifyAll(new aws.Comprehend(config))
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
  return fs.writeFile(fileName, AudioStream)
    .then(() => fileName)
}

const getSpeech = text => {
  const Text = cleanText(text)
  const OutputFormat = 'mp3'
  const VoiceId = 'Kimberly'
  const params = { Text, OutputFormat, VoiceId }
  return polly.synthesizeSpeechAsync(params)
}

const saveSpeechLocally = text => {
  return getSpeech(text).then(saveSpeech)
}

module.exports = {
  getEntities,
  saveSpeechLocally
}
