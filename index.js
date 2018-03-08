const _ = require('lodash')

const awsHelper = require('./awsHelper')
const mediumHelper = require('./mediumHelper')

const util = require('util')
const exec = util.promisify(require('child_process').exec)

const webshot = require('webshot')
const screenshot = (url, file) => new Promise((resolve, reject) => {
  const screenSize = { width: 1920, height: 1080 }
  webshot(url, file, { screenSize }, error => {
    if (error) {
      return reject(error)
    }
    resolve(file)
  })
})

const log = console.log.bind(console)

const takeScreenshot = (username, postId) => {
  const fileName = './images/' + new Date().getTime() + '.png'
  const url = userPostUrl(username, postId)
  return screenshot(url, fileName).then(() => fileName)
}

const createVideo = (image, audio) => {
  const fileName = './videos/' + new Date().getTime() + '.mp4'
  const command = [
    'ffmpeg -loop 1 -i ',
    image,
    ' -i ',
    audio,
    ' -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest ',
    fileName
  ].join('')
  return exec(command).then(() => fileName)
}

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
  const screenshotPath = await takeScreenshot(username, postId)
  console.log(`Creating video from ${screenshotPath} and ${speechPath}`)
  return createVideo(screenshotPath, speechPath)
}

const usernames = [
  'julsimon',
  'adhorn',
  'jonathanmv'
]

run(usernames[2], 1)
.then(log)
.catch(log)
