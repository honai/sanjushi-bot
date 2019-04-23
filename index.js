const express = require('express')
const line = require('@line/bot-sdk')

const db = require('./modules/db')
const message = require('./modules/handleMessage')

const PORT = process.env.PORT || 3000

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
  function reply(textArray) {
    return client.replyMessage(event.replyToken, textArray.map(text => (
      {type: 'text', text: text}
    )))
  }
  console.log(event)
  const userId = event.source.userId
  const name = message.detectName(event.message.text)
  if (name !== null) {
    const nameRes = await db.setName(userId, name)
    if (nameRes === 1) {
      return reply(['setNameエラー'])
    }
    return reply([`名前を${name}に変更したよ。`])
  }
  const counts = message.count(event.message.text)
  if (counts.absent === 0 && counts.late === 0) {
    return Promise.resolve(null)
  }

  const getRes = await db.get(userId)
  if (getRes === 1) {
    return reply(['getエラー'])
  }
  const item = {}
  item._id = getRes.Item._id.S
  item.data = {
    absent: Number(getRes.Item.data.M.absent.N),
    late: Number(getRes.Item.data.M.late.N),
    displayName: getRes.Item.data.M.displayName.S
  }
  if (Object.keys(item).length === 0) {
    if (db.create(userId, counts) === 1) {
      return reply(['createエラー'])
    }
    const texts = [
      "はじめまして。遅刻と欠席のカウントをするよ。\n"
        + "メッセージに「遅刻」「欠席」が含まれていると、ええ感じに数字を読み取ってデータベースに追加していくよ。\n"
        + "間違って加算された場合は、負の数を言うことで修正できるよ。",
      `名無しさん\n遅刻: ${counts.late} 欠席: ${counts.absent}`,
      '名前を変えるには「名前変更 たろう」みたいに言ってね。'
    ]
    return reply(texts)
  }

  const newCounts = {
    absent: counts.absent + item.data.absent,
    late: counts.late + item.data.late
  }

  const updateRes = await db.update(userId, newCounts)
  if (updateRes === 1) {
    return reply(['updateエラー'])
  }
  return reply([`${item.data.displayName}さん\n遅刻: ${newCounts.late} 欠席: ${newCounts.absent}`])
}

module.exports = app