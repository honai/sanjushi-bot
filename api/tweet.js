const action = require('../modules/action')
const Twitter = require('twitter')

const authParams = {
  consumer_key: process.env.TW_CONSUMER_KEY,
  consumer_secret: process.env.TW_CONSUMER_SECRET,
  access_token_key: process.env.TW_USER_TOKEN,
  access_token_secret: process.env.TW_USER_SECRET
}

const client = new Twitter(authParams)

module.exports = async (req, res) => {
  if (req.query.k !== process.env.POST_KEY) {
    res.status(403)
    res.send('forbidden')
    return
  }

  const ranking = await action.ranking()

  const params = {
    status: ranking[0].text
  }
  client.post('statuses/update', params)
    .then(tweet => {
      res.json(tweet)
    })
    .catch(error => {
      res.status(500)
      res.send('Twitter API Error')
    })
}
