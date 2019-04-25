const db = require('./db')
const message = require('./handleMessage')

const def = {
  COUNT: 'COUNT',
  RANKING: 'RANKING',
  SETNAME: 'SETNAME'
}

async function count(event, client) {
  const { absent, late} = message.count(event.message.text)
  if (absent === 0 && late === 0 ) {
    return false
  }
  const getResponse = await db.get(event.source.userId)
  if (Object.keys(getResponse).length === 0) {
    const { displayName } = await client.getProfile(userId)
    if (await db.create(userId, counts, displayName) === 1) {
      return true
    }  
    const texts = [
      "はじめまして。遅刻と欠席のカウントをするよ。\n"
        + "メッセージに「遅刻」「欠席」が含まれていると、ええ感じに数字を読み取ってデータベースに追加していくよ。\n"
        + "間違って加算された場合は、負の数を言うことで修正できるよ。",
      `${displayName}さん\n遅刻: ${late} 欠席: ${absent}`,
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

  if (await db.update(userId, newCounts) === 1) {
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
        late: Number(item.data.M.late.late.N),
        displayName: item.data.M.displayName.S
      }
    }
  ))
  const textArr = data.sort((a, b) => {
    return (b.data.absent + b.data.late) - (a.data.absent + a.data.late)
  }).map(item => (
    `${item.data.displayName}さん`
      + `遅刻 ${'l'.repeat(item.data.late)}\n`
      + `欠席 ${'l'.repeat(item.data.absent)}\n`
  ))
  client.replyMessage(event.replyToken, {
    type: 'text',
    text: textArr.join('\n')
  })
}

async function setName(event, client) {
  const newName = message.detectName(event.message.text)
  if (name === null) {
    return false
  }
  if (await db.setName(event.source.userId, newName) === 1) {
    return true
  }
  client.replyMessage(event.replyToken, [{
    type: 'text', text: `名前を${name}に変更したよ。`
  }])
  return false
}

module.exports = {
  def: def,
  cout: count,
  setName: setName,
  ranking: ranking
}