const {
  updateRequest
} = require('../src/awsHelper')

const postId = 'edbf9d528e68'
const username = 'jonathanmv'

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
