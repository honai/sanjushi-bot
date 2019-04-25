const db = require('./db')
const message = require('./handleMessage')

async function countFromMessage(event, client) {
  const counts = message.count(event.message.text)
  if (counts.absent === 0 && counts.late === 0 ) {
    return false
  }
  const getRes = await db.get(event.source.userId)
  if (Object.keys(getRes).length === 0) {
    const { displayName } = await client.getProfile(event.source.userId)
    if (await db.create(event.source.userId, counts, displayName) === 1) {
      return true
    }
    const texts = [
      "はじめまして。遅刻と欠席のカウントをするよ。\n"
        + "メッセージに「遅刻」「欠席」が含まれていると、ええ感じに数字を読み取ってデータベースに追加していくよ。\n"
        + "間違って加算された場合は、負の数を言うことで修正できるよ。",
      `${displayName}さん\n遅刻: ${counts.late} 欠席: ${counts.absent}`,
      '名前を変えるには「名前変更 イオ」みたいに言ってね。'
    ]
    client.replyMessage(event.replyToken, texts.map(text => (
      { type: 'text', text: text }
    )))
    return false
  }
  const item = {}
  item._id = getRes.Item._id.S
  item.data = {
    absent: Number(getRes.Item.data.M.absent.N),
    late: Number(getRes.Item.data.M.late.N),
    displayName: getRes.Item.data.M.displayName.S
  }

  const newCounts = {
    absent: counts.absent + item.data.absent,
    late: counts.late + item.data.late
  }

  if (await db.update(event.source.userId, newCounts) === 1) {
    return true
  }
  client.replyMessage(event.replyToken, [{
    type: 'text',
    text: `${item.data.displayName}さん\n遅刻: ${newCounts.late} 欠席: ${newCounts.absent}`
  }])
  return false
}

async function ranking(event, client) {
  const scanRes = await db.scan()
  const data = scanRes.Items.map(item => (
    {
      userId: item._id.S,
      data: {
        absent: Number(item.data.M.absent.N),
        late: Number(item.data.M.late.N),
        displayName: item.data.M.displayName.S
      }
    }
  ))
  const textArr = data.sort((a, b) => {
    return (b.data.absent + b.data.late) - (a.data.absent + a.data.late)
  }).map(item => (
    `${item.data.displayName}さん`
      + `遅刻 ${'l'.repeat(item.data.late)}\n`
      + `欠席 ${'l'.repeat(item.data.absent)}`
  ))
  console.log(textArr)
  client.replyMessage(event.replyToken, {
    type: 'text',
    text: textArr.join('\n')
  })
  return false
}

async function setName(event, client) {
  const newName = message.detectName(event.message.text)
  if (newName === null) {
    return false
  }
  if (await db.setName(event.source.userId, newName) === 1) {
    return true
  }
  client.replyMessage(event.replyToken, [{
    type: 'text', text: `名前を${newName}に変更したよ。`
  }])
  return false
}

module.exports = {
  coutFromMessage: countFromMessage,
  setName: setName,
  ranking: ranking
}