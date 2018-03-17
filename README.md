
### Create a video from a Medium Post using Amazon Polly and Amazon Comprehend
Read more about this code in [here](https://goo.gl/QetqB1) and [here](https://goo.gl/UE9Fbd)
# To run it
1. Clone this repo: `git clone https://github.com/jonathanmv/faceless-influencer.git`
2. Create the `audios, images, videos` folders at the same level as your `index.js` file. The script assumes they exist.
3. Install the dependencies: `npm install`.
The dependencies also include [ffmpeg](https://www.ffmpeg.org/) and a configured [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html). The first to create the videos and the second to load the configuration variables for your aws developer account. You can skip the aws-cli if you add your aws secret and key to the configuration in the `awsHelper.js` file. Just don't make them public.
4. Run it: `npm start`
By default it will create a video from the latest post for the [@jonathanmv](https://medium.com/@jonathanmv) user on Medium. You can create videos for different users by specified an environment variable like this: `username=pepito postId=1vd44ea5 npm start`. It will create a video from the post if found.
# To run tests
Run `npm test`

# To get access token
Run `npm run token`

# To build docker and deploy image
Run `npm run ecs-login`
Run `npm run docker-deploy`
