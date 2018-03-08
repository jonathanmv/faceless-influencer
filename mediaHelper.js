const webshot = require('webshot')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const screenshot = (url, file) => new Promise((resolve, reject) => {
  const screenSize = { width: 1920, height: 1080 }
  webshot(url, file, { screenSize }, error => {
    if (error) {
      return reject(error)
    }
    resolve(file)
  })
})

const takeScreenshot = url => {
  const fileName = './images/' + new Date().getTime() + '.png'
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

module.exports = {
  takeScreenshot,
  createVideo
}
