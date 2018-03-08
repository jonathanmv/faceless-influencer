const _ = require('lodash')

const awsHelper = require('./awsHelper')
const mediumHelper = require('./mediumHelper')
const mediaHelper = require('./mediaHelper')

const log = console.log.bind(console)

const run = async (username, postNumber) => {
  const postIds = await mediumHelper.latestPostsIds(username)
  const postId = postIds[postNumber - 1]
  if (!postId) {
    console.log(`Couldn't find post #${postNumber}`)
    return
  }
  console.log('Getting user post analysis')
  const analysis = await mediumHelper.getUserPostAnalysis(username, postId)
  console.log(analysis)
  console.log('Saving speech ...')
  const speechPath = await awsHelper.saveSpeechLocally(analysis)
  console.log('Saving screenshot ...')
  const screenshotPath = await mediumHelper.saveUserPostScreenshotLocally(username, postId)
  console.log(`Creating video from ${screenshotPath} and ${speechPath}`)
  return mediaHelper.createVideo(screenshotPath, speechPath)
}

const usernames = [
  'julsimon',
  'adhorn',
  'jonathanmv'
]

run(usernames[2], 1)
.then(log)
.catch(log)
