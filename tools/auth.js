// Used to get access token and refresh token
const { createAuth, requestToken } = require('../src/youtubeHelper')

requestToken(createAuth()).then(({ credentials }) => console.log(`
Set the environment variables like this:
GOOGLE_ACCESS_TOKEN=${credentials.access_token}
GOOGLE_REFRESH_TOKEN=${credentials.refresh_token}
`)).catch(error => console.log(`
There was an error requesting the token:
${error.message || error}
`))
