// Based on https://developers.google.com/youtube/v3/docs/videos/insert
// get client_secret https://cloud.google.com/genomics/downloading-credentials-for-api-access
// issues with the auth library https://github.com/google/google-auth-library-nodejs/issues/251

var fs = require('fs');
var readline = require('readline');
var util = require('util');
var { google } = require('googleapis');
// https://github.com/google/google-auth-library-nodejs/issues/251#issuecomment-367479373
var { OAuth2 } = google.auth;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/google-apis-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE || '.') + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'google-apis-nodejs-quickstart.json';



// Load client secrets from a local file.
const start = () => {
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    //See full code sample for authorize() function code.
  authorize(JSON.parse(content), {'params': {'part': 'snippet,status'}, 'properties': {'snippet.categoryId': '22',
                   'snippet.defaultLanguage': '',
                   'snippet.description': 'Description of uploaded video.',
                   'snippet.tags[]': '',
                   'snippet.title': 'Test video upload',
                   'status.embeddable': '',
                   'status.license': '',
                   'status.privacyStatus': 'private',
                   'status.publicStatsViewable': ''
        }, 'mediaFilename': './videos/1521019708326.mp4'}, videosInsert);

  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, requestData, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, requestData, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, requestData);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, requestData, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, requestData);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Remove parameters that do not have values.
 *
 * @param {Object} params A list of key-value pairs representing request
 *                        parameters and their values.
 * @return {Object} The params object minus parameters with no values set.
 */
function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}

/**
 * Create a JSON object, representing an API resource, from a list of
 * properties and their values.
 *
 * @param {Object} properties A list of key-value pairs representing resource
 *                            properties and their values.
 * @return {Object} A JSON object. The function nests properties based on
 *                  periods (.) in property names.
 */
function createResource(properties) {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value) {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    // Leave properties that don't have values out of inserted resource.
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    };
  }
  return resource;
}


function videosInsert(auth, requestData) {
  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(requestData['params']);
  parameters['auth'] = auth;
  parameters['media'] = { body: fs.createReadStream(requestData['mediaFilename']) };
  parameters['notifySubscribers'] = false;
  parameters['resource'] = createResource(requestData['properties']);
  var req = service.videos.insert(parameters, function(err, data) {
    if (err) {
      console.log('The API returned an error: ' + err);
    }
    if (data && !err) {
      console.log(util.inspect(data, false, null));
    }
    process.exit();
  });

  var fileSize = fs.statSync(requestData['mediaFilename']).size;
  var errorCount = 0;
  // show some progress
  var id = setInterval(function () {
    try {
      var uploadedBytes = req.req.connection._bytesDispatched;
      var uploadedMBytes = uploadedBytes / 1000000;
      var progress = uploadedBytes > fileSize
          ? 100 : (uploadedBytes / fileSize) * 100;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(uploadedMBytes.toFixed(2) + ' MBs uploaded. ' +
         progress.toFixed(2) + '% completed.');
      if (progress === 100) {
        process.stdout.write('Done uploading, waiting for response...');
        clearInterval(id);
      }
    } catch (error) {
      console.log(`There was an error checking progress: ${error.message || error}`);
      if (++errorCount>4) {
        clearInterval(id);
        console.log(`Too many errors. Not trying anymore. Last error:`);
        console.log(error);
      }
    }
  }, 250);
}

const requestToken = async auth => new Promise((resolve, reject) => {
  try {
    getNewToken(auth, null, resolve)
  } catch (error) {
    reject(error)
  }
})

const refreshToken = auth => new Promise((resolve, reject) => {
  auth.refreshAccessToken((error, tokens) => {
    if (error) {
      console.log(`Error refreshing tokens: ` + error.message);
      reject(error)
    } else {
      console.log(`Token refreshed`);
      resolve(auth)
    }
  })
})

// https://www.npmjs.com/package/googleapis#manually-refreshing-access-token
const createAuth = () => {
  const {
    GOOGLE_CLIENT_ID = '',
    GOOGLE_CLIENT_SECRET = '',
    GOOGLE_REDIRECT_URI = ''
  } = process.env
  if (!GOOGLE_CLIENT_ID.length || !GOOGLE_CLIENT_SECRET.length || !GOOGLE_REDIRECT_URI.length) {
    throw new Error(`Missing one of GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI environment variables`)
  }

  return new OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
}

const setCredentials = async auth => {
  const {
    GOOGLE_ACCESS_TOKEN = '',
    GOOGLE_REFRESH_TOKEN = ''
  } = process.env
  if (GOOGLE_ACCESS_TOKEN.length && GOOGLE_REFRESH_TOKEN.length) {
    console.log(`Setting credentials from env vars`);
    auth.setCredentials({
      access_token: GOOGLE_ACCESS_TOKEN,
      refresh_token: GOOGLE_REFRESH_TOKEN
    })
    auth = await refreshToken(auth)
  } else {
    console.log(`Requesting credentials`);
    auth = await requestToken(auth)
  }

  return auth
}

const buildInsertVideoParams = (mediaFilename, { title, description }) => ({
  'params': { 'part': 'snippet,status' },
  'properties': {
    'snippet.categoryId': '22', // People and Blogs - https://gist.github.com/dgp/1b24bf2961521bd75d6c
    'snippet.defaultLanguage': '',
    'snippet.description': description,
    'snippet.tags[]': '',
    'snippet.title': title,
    'status.embeddable': '',
    'status.license': '',
    'status.privacyStatus': 'public',
    'status.publicStatsViewable': ''
  },
  mediaFilename
})

const printProgress = (call, fileSize) => {
  var errorCount = 0;
  // show some progress
  var id = setInterval(function () {
    try {
      var uploadedBytes = call.connection._bytesDispatched;
      var uploadedMBytes = uploadedBytes / 1000000;
      var progress = uploadedBytes > fileSize
          ? 100 : (uploadedBytes / fileSize) * 100;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(uploadedMBytes.toFixed(2) + ' MBs uploaded. ' +
         progress.toFixed(2) + '% completed.');
      if (progress === 100) {
        process.stdout.write('Done uploading, waiting for response...');
        clearInterval(id);
      }
    } catch (error) {
      console.log(`There was an error checking progress: ${error.message || error}`);
      if (++errorCount>4) {
        clearInterval(id);
        console.log(`Too many errors. Not trying anymore. Last error:`);
        console.log(error);
      }
    }
  }, 250);
}

const insertVideo = async (auth, params) => new Promise((resolve, reject) => {
  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(params['params']);
  parameters['auth'] = auth;
  parameters['media'] = { body: fs.createReadStream(params['mediaFilename']) };
  parameters['notifySubscribers'] = false;
  parameters['resource'] = createResource(params['properties']);

  // https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253
  var request = service.videos.insert(parameters, (error, request) => {
    if (error) {
      console.log(`Could not upload video: ` + error.message);
      reject(error)
    } else {
      console.log(`Video uploaded`);
      resolve(request.data)
    }
  })
  console.log(`Uploading ${params['mediaFilename']}`);
  // var fileSize = fs.statSync(params['mediaFilename']).size;
  // printProgress(request, fileSize)

})

const uploadVideo = async (fileName, { title, description }) => {
  const auth = createAuth()
  await setCredentials(auth)
  const params = buildInsertVideoParams(fileName, { title, description })
  return await insertVideo(auth, params)
}

module.exports = {
  createAuth,
  requestToken,
  uploadVideo
}
