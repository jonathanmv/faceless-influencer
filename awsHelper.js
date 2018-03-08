const bluebird = require('bluebird')
const aws = require('aws-sdk')
const comprehend = bluebird.promisifyAll(new aws.Comprehend({ region: 'us-east-1'}))

const MAX_STRING_LENGTH = 4800 // It's 5000 bytes but that's ok
const cleanText = text => text.slice(0, MAX_STRING_LENGTH)

const getEntities = text => {
  const Text = cleanText(text)
  const LanguageCode = 'en'
  return comprehend.detectEntitiesAsync({ Text, LanguageCode })
}

module.exports = {
  getEntities
}
