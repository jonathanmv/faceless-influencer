const axios = require('axios')
const _ = require('lodash')
const plural = require('plural')

const awsHelper = require('./awsHelper')
const mediaHelper = require('./mediaHelper')

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
  const jsonBeginsAt = string.indexOf('{')
  return string.slice(jsonBeginsAt)
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
  const others = rest.length && `. Some other mentions include ${rest} plus many others` || ''
  return intro + topCount + topCounts + others
}

const describeTypesCounts = counts => {
  const intro = `Regarding the types of entities, it includes `
  const other = counts.find(({name}) => name = 'OTHER')
  const noOther = counts.filter(({name}) => name != 'OTHER')
  const body = noOther.map(({name, count}) => `${count} ${plural(cleanName(name), count)}`).join(', ')
  const closing = `, and also some other ${other.count} things`
  return intro + body + closing
}

const describePostTexts = texts => {
  const postTitle = texts[0]
  const postIntro = texts.slice(1, 4).join('.\n')
  const intro = `The post is titled "${postTitle}" and it reads as it follows:\n`
  return intro + postIntro
}

const getPostAnalysis = async textsInPost => {
  const entitiesResponse = await awsHelper.getEntities(textsInPost.join('.\n'))
  const postTextDescription = describePostTexts(textsInPost)
  const stats = getStatsFromComprehendResponse(entitiesResponse)
  let intro = describePostTexts(textsInPost)
  const joiner = `Ok, now let's analyze it`
  const entitiesAnalysis = describeEntityCounts(stats.sortedEntityNamesCount)
  const typesAnalysis = describeTypesCounts(stats.sortedTypesCount)
  const closing = `That's it for today folks. Let me know what you think in the comments. Support me on patreon and don't forget to like this video and subscribe to my channel. Cheers and until next time.`
  let descriptions = [
    intro,
    joiner,
    entitiesAnalysis,
    typesAnalysis,
    closing
  ]
  let analysis = descriptions.join('.\n')
  // awsHelper MAX_POLLY_STRING_LENGTH
  if (analysis.length > 1500) {
    const difference = 1500 - analysis.length
    // Remove extra length from the intro
    intro = intro.slice(0, difference)
    analysis = [
      intro,
      joiner,
      entitiesAnalysis,
      typesAnalysis,
      closing
    ].join('.\n')
  }
  return analysis
}

const getUserPostAnalysis = async (username, postId) => {
  const textsInPost = await textInPostId(username, postId)
  return getPostAnalysis(textsInPost)
}

const saveUserPostScreenshotLocally = (username, postId) => {
  const url = userPostUrl(username, postId)
  return mediaHelper.takeScreenshot(url)
}

const buildPostInfo = (username, postId, postText) => {
  const title = postText[0]
  const url = userPostUrl(username, postId)
  const description = `This is my analysis for "${title}" that you can read at ${url}`
  return { title, description }
}

module.exports = {
  textInPostId,
  latestPostsIds,
  getPostAnalysis,
  getUserPostAnalysis,
  saveUserPostScreenshotLocally,
  buildPostInfo
}
