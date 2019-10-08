const line = require('@line/bot-sdk')

const action = require('../modules/action')
const message = require('../modules/handleMessage')

process.on('unhandledRejection', console.dir)

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
}

const client = new line.Client(config)

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }
  const messageText = event.message.text
  const ACTION = message.trigger(messageText)
  switch(ACTION) {
    case message.actionDef.RANKING:
      const reply = await action.ranking()
      if (reply) {
        return client.replyMessage(event.replyToken, reply)
      }
      break
    case message.actionDef.SETNAME:
      const reply2 = await action.setName(event)
      if (reply2) {
        return client.replyMessage(event.replyToken, reply2)
      }
      break
    case message.actionDef.COUNT:
      const reply4 = await action.coutFromMessage(event, client)
      if (reply4) {
        return client.replyMessage(event.replyToken, reply3)
      }
      break
    default:
      return Promise.resolve(null)
  }
  return Promise.resolve(null)
}

module.exports = (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
}