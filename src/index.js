const awsHelper = require('./awsHelper')
const mediumHelper = require('./mediumHelper')
const mediaHelper = require('./mediaHelper')

const log = console.log.bind(console)

const createAndUploadVideo = async (username, postNumber) => {
  const postIds = await mediumHelper.latestPostsIds(username)
  const postId = postIds[postNumber - 1]
  if (!postId) {
    log(`Couldn't find post #${postNumber}`)
    return
  }
  log('Getting user post analysis')
  const analysis = await mediumHelper.getUserPostAnalysis(username, postId)
  log(analysis)
  log('Saving speech ...')
  const speechPath = await awsHelper.saveSpeechLocally(analysis)
  log('Saving screenshot ...')
  const screenshotPath = await mediumHelper.saveUserPostScreenshotLocally(username, postId)
  log(`Creating video from ${screenshotPath} and ${speechPath}`)
  return mediaHelper.createVideo(screenshotPath, speechPath)
}

const run = ({ username = 'jonathanmv', post = 1 }) => {
  return createAndUploadVideo(username, post)
    .then(log)
    .catch(log)
}

run(process.env)
