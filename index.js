const axios = require('axios')
const _ = require('lodash')
const plural = require('plural')

const awsHelper = require('./awsHelper')

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

const comprehendEntitiesResponse = require('./samples/comprehendEntitiesResponse.json')

const username = 'julsimon'
const postIds = [
  '46345ccec0f4',
  'da09f30cca38',
  '8d14fce03b9',
  'ba8eededd737',
  '4bce4e56ef55',
  'f6ee46182f80',
  'e371cf94ddb5',
  'cedbfc8c93d8',
  '5596f38931b3',
  'da819d8a4887'
]


const asJson = url => `${url}?format=json`
const userUrl = username => `https://medium.com/@${username}`
const latestPostsJsonUrl = username => asJson(`${userUrl(username)}/latest`)
const userPostUrl = (username, postId) => `${userUrl(username)}/${postId}`
const userPostJsonUrl = (username, postId) => asJson(userPostUrl(username, postId))

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
  const url = latestPostsJsonUrl(username)
  const data = await getJsonData(url)
  return postsIdsFromResponse(data)
}

const DEFAULT_TYPES = [
  1, // p
  3, // h3,
  13, // h4,
  // 4, // figcaption for images
  // 6, // blockquote
]
const textInPostFromResponse = (response, types = DEFAULT_TYPES) => {
  const paragraphs = _.get(response, 'payload.value.content.bodyModel.paragraphs', [])
  const filtered = paragraphs.filter(({ type }) => types.includes(type))
  return filtered.map(({text}) => text)
}

const textInPostId = async (username, postId) => {
  const url = userPostJsonUrl(username, postId)
  const data = await getJsonData(url)
  return textInPostFromResponse(data)
}

// COMMERCIAL_ITEM to comercial item
const cleanName = name => _.words(name.toLowerCase()).join(' ')

const toNameCount = object => Object.keys(object).map(name => ({ name, count: object[name] }))
const sortByCountDesc = objects => _.sortBy(objects, 'count').reverse()
const toSortedCountDesc = object => sortByCountDesc(toNameCount(object))

const getStatsFromComprehendResponse = ({ Entities }) => {
  const entityTypeCounts = _.countBy(_.uniqBy(Entities, 'Text'), 'Type')
  const sortedTypesCount = toSortedCountDesc(entityTypeCounts)
  const nonQuantityEntities = Entities.filter(({ Type }) => Type != 'QUANTITY')
  const entityNameCounts = _.countBy(nonQuantityEntities, 'Text')
  const sortedEntityNamesCount = toSortedCountDesc(entityNameCounts)
  return { sortedTypesCount, sortedEntityNamesCount }
}

const describeEntityCounts = counts => {
  const top = counts[0]
  const intro = `We find a total of ${counts.length} entities mentioned. `
  const topCount = `Mainly "${top.name}" which appears ${top.count} times, followed by `
  const topCounts = counts.slice(1, 4).map(({name, count}) => `"${name}" mentioned ${count} times`).join(', ')
  const rest = counts.slice(4, 7).map(({name}) => name).join(', ')
  const others = `. Some other mentions include ${rest} plus many others`
  return intro + topCount + topCounts + others
}

const describeTypesCounts = counts => {
  const intro = `Regarding the types of entities, it includes `
  const other = counts.find(({name}) => name = 'OTHER')
  const noOther = counts.filter(({name}) => name != 'OTHER')
  const body = noOther.map(({name, count}) => `${count} ${plural(cleanName(name), count)}`).join(', ')
  const closing = `, and also some other ${other.count} things.`
  return intro + body + closing
}

const describePostTexts = texts => {
  const postTitle = texts[0]
  const postIntro = texts.slice(1, 4).join('.\n')
  const intro = `The post is titled "${postTitle}" and it reads as it follows:\n`
  return intro + postIntro
}

const log = console.log.bind(console)

const getUserPostAnalysis = async (username, postId) => {
  const textsInPost = await textInPostId(username, postId)
  const entitiesResponse = await awsHelper.getEntities(textsInPost.join('.\n'))
  const postTextDescription = describePostTexts(textsInPost)
  const stats = getStatsFromComprehendResponse(entitiesResponse)
  const descriptions = [
    describePostTexts(textsInPost),
    `Ok, now let's analyze it`,
    describeEntityCounts(stats.sortedEntityNamesCount),
    describeTypesCounts(stats.sortedTypesCount)
  ]
  const analysis = descriptions.join('.\n')
  console.log(analysis);
  return analysis
}

const takeScreenshot = (username, postId) => {
  const fileName = './images/' + new Date().getTime() + '.png'
  const url = userPostUrl(username, postId)
  return screenshot(url, fileName).then(() => fileName)
}

const run = async (username, postId) => {
  // console.log('Getting user post analysis');
  // const analysis = await getUserPostAnalysis(username, postId)
  // console.log(analysis);
  // console.log('Saving speech ...');
  // const speechPath =  awsHelper.saveSpeechLocally(analysis)
  console.log('Saving screenshot ...');
  const screenshotPath = await takeScreenshot(username, postId)
  console.log(screenshotPath);
}

run(username, postIds[4])
.then(log)
.catch(log)
