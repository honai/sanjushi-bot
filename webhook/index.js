const express = require('express')
const line = require('@line/bot-sdk')

const action = require('../modules/action')
const message = require('../modules/handleMessage')

process.on('unhandledRejection', console.dir)

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
}

const app = express()

app.post('*', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
});

const client = new line.Client(config)

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }
  const messageText = event.message.text
  const ACTION = message.trigger(messageText)
  switch(ACTION) {
    case action.def.RANKING:
      if (await action.ranking(event, client)) {
        return Promise.resolve(null)
      }
      break
    case action.def.SETNAME:
      if (await action.setName(event, client)) {
        return Promise.resolve(null)
      }
      break
    case action.def.COUNT:
      if (await action.count(event, client)) {
        return Promise.resolve(null)
      }
      break
    default:
      return Promise.resolve(null)
  }
  return client.replyMessage(event.replyToken, {type: 'text', text: 'エラー'})
}

module.exports = app