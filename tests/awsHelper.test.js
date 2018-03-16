const {
  updateRequest,
  sendVideoUploadedEmail
} = require('../src/awsHelper')

const postId = 'edbf9d528e68'
const postTitle = 'Faceless Influencer'
const postUrl = `https://medium.com/@jonathanmv/faceless-influencer-edbf9d528e68`
const username = 'jonathanmv'
const userEmail = 'jonathanmv@outlook.com'
const videoUrl = 'https://www.youtube.com/watch?v=b-fVMcniCGU'

describe.skip('updateRequest', () => {
  it('should update the item', () => {
    const request = {
      username,
      postId,
      updatedAt: new Date().getTime()
    }
    return expect(updateRequest(request)).resolves.toEqual(request)
  })
})

describe.skip('sendVideoUploadedEmail', () => {
  it('should send an email', () => {
    const request = {
      username,
      userEmail,
      postId,
      postTitle,
      postUrl,
      videoUrl
    }
    return expect(sendVideoUploadedEmail(request)).resolves.toHaveProperty('MessageId')
  })
})
