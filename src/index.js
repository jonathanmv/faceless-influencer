const awsHelper = require('./awsHelper')
const mediumHelper = require('./mediumHelper')
const mediaHelper = require('./mediaHelper')
const youtubeHelper = require('./youtubeHelper')

const log = console.log.bind(console)

const createAndUploadVideo = async (username, postNumber) => {
  const postIds = await mediumHelper.latestPostsIds(username)
  const postId = postIds[postNumber - 1]
  if (!postId) {
    log(`Couldn't find post #${postNumber}`)
    return
  }
  log('Getting user post analysis')
  const post = await mediumHelper.textInPostId(username, postId)
  const info = mediumHelper.buildPostInfo(username, postId, post)
  const analysis = await mediumHelper.getPostAnalysis(post)
  log(analysis)
  log('Saving speech ...')
  const speechPath = await awsHelper.saveSpeechLocally(analysis)
  log('Saving screenshot ...')
  const screenshotPath = await mediumHelper.saveUserPostScreenshotLocally(username, postId)
  log(`Creating video from ${screenshotPath} and ${speechPath}`)
  const videoPath = await mediaHelper.createVideo(screenshotPath, speechPath)
  log(`Uploading ${videoPath} to YouTube`)
  const videoId = await youtubeHelper.uploadVideo(videoPath, info)
  return `Video uploaded at https://www.youtube.com/watch?v=${videoId}`
}

const run = ({ username = 'jonathanmv', post = 1 }) => {
  return createAndUploadVideo(username, post)
    .then(log)
    .catch(log)
}

run(process.env)
