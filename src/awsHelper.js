const { REQUESTED } = require('./states.json')
const emailHelper = require('./emailHelper')

const bluebird = require('bluebird')
const aws = require('aws-sdk')
// plus the confiuration in the ~/.aws/credentials file
const config = { region: 'us-east-1' }
const comprehend = bluebird.promisifyAll(new aws.Comprehend(config))
const polly = bluebird.promisifyAll(new aws.Polly(config))
const db = bluebird.promisifyAll(new aws.DynamoDB.DocumentClient(config))
const ses = bluebird.promisifyAll(new aws.SES(config))
const fs = bluebird.promisifyAll(require('fs'))

const MAX_STRING_LENGTH = 4800 // It's 5000 bytes but that's ok
const MAX_POLLY_STRING_LENGTH = 1500

const REQUESTS_TABLE_NAME = 'medium-to-youtube-requests'

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
  if (text.length > MAX_POLLY_STRING_LENGTH) {
    throw new Error('TextLengthExceededException: Maximum text length has been exceeded')
  }
  const Text = cleanText(text)
  const OutputFormat = 'mp3'
  const VoiceId = 'Kimberly'
  const params = { Text, OutputFormat, VoiceId }
  return polly.synthesizeSpeechAsync(params)
}

const saveSpeechLocally = text => getSpeech(text).then(saveSpeech)

const getRequest = (username, postId) => {
  const Key = { username, postId }
  const TableName = REQUESTS_TABLE_NAME
  const params = { TableName, Key }
  return db.getAsync(params)
    .then(({Item}) => Item)
    .catch(error => {
      console.log(`Error getting request from db: ${error.message}`)
      console.log(params)
    })
}

const updateRequest = request => {
  const { username, postId } = request
  const Key = { username, postId }
  const TableName = REQUESTS_TABLE_NAME
  const keys = Object.keys(request).filter(k => k != 'username' && k != 'postId')
  const UpdateExpression = `set ${keys.map(k => `#${k} = :${k}`).join(', ')}`
  const ExpressionAttributeNames = keys.reduce((o, k) => Object.assign(o, {[`#${k}`]: k}), {})
  const ExpressionAttributeValues = keys.reduce((o, k) => Object.assign(o, {[`:${k}`]: request[k]}), {})
  const params = {
    TableName,
    Key,
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }
  return db.updateAsync(params)
    .then(_ => request)
    .catch(error => {
      console.log(`Error updating request on db: ${error.message}`)
      console.log(params)
      throw error
    })
}

const sendVideoUploadedEmail = request => {
  const params = emailHelper.buildEmailFromRequest(request)
  return ses.sendEmailAsync(params)
}

module.exports = {
  getEntities,
  saveSpeechLocally,
  updateRequest,
  sendVideoUploadedEmail
}
