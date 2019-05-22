const db = require('./db')
const message = require('./handleMessage')

const errorRep = [{
  type: 'text',
  message: 'エラー'
}]

async function countFromMessage(event, client) {
  const counts = message.count(event.message.text)
  if (counts.absent === 0 && counts.late === 0 ) {
    return null
  }
  const getRes = await db.get(event.source.userId)
  if (Object.keys(getRes).length === 0) {
    const { displayName } = await client.getProfile(event.source.userId)
    if (await db.create(event.source.userId, counts, displayName) === 1) {
      return errorRep
    }
    const replys = [
      "はじめまして。遅刻と欠席のカウントをするよ。\n"
        + "メッセージに「遅刻」「欠席」が含まれていると、ええ感じに数字を読み取ってデータベースに追加していくよ。\n"
        + "間違って加算された場合は、負の数を言うことで修正できるよ。",
      `${displayName}さん\n遅刻: ${counts.late} 欠席: ${counts.absent}`,
      '名前を変えるには「名前変更 イオ」みたいに言ってね。'
    ]
    return texts.map(text => (
      { type: 'text', text: text }
    ))
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
    return errorRep
  }
  return [{
    type: 'text',
    text: `${item.data.displayName}さん\n遅刻: ${newCounts.late} 欠席: ${newCounts.absent}`
  }]
}

function makeGraphText(label, count) {
  if (count < 0) {
    return 'マイナス #とは'
  }
  const repeatNum = Math.floor(count / 25)
  if (repeatNum === 0) {
    return `${label} ${'|'.repeat(count)} ${String(count)}`
  }
  let graphText = `${label} ${'|'.repeat(25)} ${String(count)}`
  for (let i = 1; i < repeatNum; i++) {
    graphText += `\n${'　'.repeat(label.length)} ${'|'.repeat(25)}`
  }
  if (count % 25 === 0) {
    return graphText
  }
  graphText += `\n${'　'.repeat(label.length)} ${'|'.repeat(count % 25)}`
  return graphText
}

async function ranking() {
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
  function customSort(a, b) {
    const pointDiff = (b.absent * 2 + b.late) - (a.absent * 2 + a.late)
    if (pointDiff !== 0) {
      return pointDiff
    }
    return b.absent - a.absent
  }
  const sorted = data.sort((a, b) => (
    customSort(a.data, b.data)
  ))
  const textArr = sorted.map((item, index) => {
    // rank starts with 0
    // undefinedへのアクセスを避けるため
    let rank = index + 1
    while (customSort(item.data, sorted[rank - 1].data) === 0) {
      rank -= 1
      if (rank === 0) {
        break
      }
    }
    return (
      `${String(rank+1)}位 ${item.data.displayName}さん ${String(item.data.absent*2+item.data.late)}pt\n`
      + makeGraphText('遅刻', item.data.late) + '\n'
      + makeGraphText('欠席', item.data.absent)
    )
  })

  return [{
    type: 'text',
    text: textArr.join('\n\n')
  }]
}

async function setName(event) {
  const newName = message.detectName(event.message.text)
  if (newName === null) {
    return null
  }
  if (await db.setName(event.source.userId, newName) === 1) {
    return errorRep
  }
  return [{
    type: 'text', text: `名前を${newName}に変更したよ。`
  }]
}

module.exports = {
  coutFromMessage: countFromMessage,
  setName: setName,
  ranking: ranking
}
