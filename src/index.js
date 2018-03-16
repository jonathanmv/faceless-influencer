const { PROCESSING, COMPLETED, ERROR } = require('./states.json')
const awsHelper = require('./awsHelper')
const mediumHelper = require('./mediumHelper')
const mediaHelper = require('./mediaHelper')
const youtubeHelper = require('./youtubeHelper')

const log = console.log.bind(console)

const createAndUploadVideo = async (username, postId) => {
  let state = PROCESSING
  let request = { username, postId, state }
  await awsHelper.updateRequest(request)
  try {
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
    const videoUrl = youtubeHelper.videoUrlFromVideoId(videoId)
    state = COMPLETED
    request = Object.assign(request, { state, videoId, videoUrl })
    await awsHelper.updateRequest(request)
    return `Video uploaded at ${videoUrl}`
  } catch (error) {
    state = ERROR
    const stateDescription = `Couldn't create video for username: ${username} and postId: ${postId}. Error: ${error.message}`
    request = Object.assign(request, { state, stateDescription })
    await awsHelper.updateRequest(request)
    return stateDescription
  }
}

const run = ({ username = 'jonathanmv', postId = 'edbf9d528e68' }) => {
  return createAndUploadVideo(username, postId)
    .then(log)
    .catch(log)
}

run(process.env)
