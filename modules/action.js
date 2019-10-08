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
    return replys.map(text => (
      { type: 'text', text: text }
    ))
  }
  const item = {}
  item._id = getRes.Item._id.S
  item.data = {
    absent: Number(getRes.Item.data.M.absent.N),
    late: Number(getRes.Item.data.M.late.N),
    displayName: getRes.Item.data.M.displayName.S,
    classNum: Number(getRes.Item.data.M.classNumber.N) || 1
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

function calcPoint(absent, late, classNum) {
  return (absent * 2 + late) * 25 / classNum
}

async function ranking() {
  const scanRes = await db.scan()
  const data = scanRes.Items.map(item => (
    {
      userId: item._id.S,
      data: {
        absent: Number(item.data.M.absent.N),
        late: Number(item.data.M.late.N),
        displayName: item.data.M.displayName.S,
        classNum: Number(item.data.M.classNumber.N)
      }
    }
  ))
  function customSort(a, b) {
    const pointDiff = calcPoint(b.absent, b.late, b.classNum) - calcPoint(a.absent, a.late, a.classNum)
    if (pointDiff !== 0) {
      return pointDiff
    }
    return b.absent - a.absent
  }
  const sorted = data.sort(customSort)
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
    const point = calcPoint(item.data.absent, item.data.late, item.data.classNum)
    return (
      `${rank + 1}位 ${item.data.displayName}さん ${point}pt ${item.data.classNum}科目\n`
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

async function setClassNum(event) {
  const newNumber = message.detectClassNum(event.message.text)
  if (newNumber === null) {
    return null
  }
  if (await db.setClassNum(event.source.userId, newNumber) === 1) {
    return errorRep
  }
  return [{
    type: 'text', text: `科目数を${newNumber.toString()}に変更したよ。`
  }]
}

module.exports = {
  coutFromMessage: countFromMessage,
  setName: setName,
  setClassNum: setClassNum,
  ranking: ranking
}
