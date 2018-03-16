
const buildEmailFromRequest = request => {
  const { postUrl, postTitle, username, userEmail, videoUrl } = request
  var params = {
     Destination: {
      // BccAddresses: [],
      // CcAddresses: [],
      ToAddresses: [userEmail]
     },
     Message: {
      Body: {
       Html: {
        Charset: "UTF-8",
        Data: `
<p>Hi ${username},</p>
<p>
  <b><a href="${videoUrl}">Here's your YouTube video</a></b> generated from the Medium post titled:
  <a href="${postUrl}"> ${postTitle}</a></p>
</p>
<p>Go ahead and update your post to include the video. When editing your post in Medium just paste this url: ${videoUrl}</p>
<p>Don't forget that you can generate more videos from <a href="http://autenti.ca">autenti.ca</a></p>
<p>Wish you a lot of views!</p>`
       },
       Text: {
        Charset: "UTF-8",
        Data: `
Hi ${username},

Copy and paste ${videoUrl} into a new tab to see your YouTube video generated from the Medium post titled:
${postTitle}. You can also read it in ${postUrl}.

Go ahead and update your post to include the video. When editing your post in Medium just paste this url: ${videoUrl}
Don't forget that you can generate more videos from http://autenti.ca
Wish you a lot of views!`
       }
      },
      Subject: {
       Charset: "UTF-8",
       Data: `${username} your video is on YouTube!`
      }
     },
     // ReplyToAddresses: [],
     // ReturnPath: "",
     // ReturnPathArn: "",
     Source: "no-reply@autenti.ca",
     // SourceArn: ""
    };
  return params
}

module.exports = {
  buildEmailFromRequest
}
