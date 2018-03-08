const axios = require('axios')
const _ = require('lodash')

const username = 'julsimon'
const streamItemsPath = ''

const asJson = url => `${url}?format=json`
const latestPostsUrl = username => asJson(`https://medium.com/@${username}/latest`)

const postsIdsFromResponse = response => {
  const items = _.get(response, 'payload.streamItems', [])
  const ids = items.map(post => _.get(post, 'postPreview.postId'))
  return _.compact(ids)
}

const cleanResponse = string => {
  const dirt = '])}while(1);</x>'
  return string.slice(dirt.length)
}

const getJsonData = async url => {
  const { data } = await axios.get(url)
  const cleaned = cleanResponse(data)
  return JSON.parse(cleaned)
}

const latestPostsIds = async username => {
  const url = latestPostsUrl(username)
  const data = await getJsonData(url)
  return postsIdsFromResponse(data)
}

const log = console.log.bind(console)
latestPostsIds(username).then(log).catch(log)
