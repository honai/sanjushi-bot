const actionDef = {
  COUNT: 'COUNT',
  RANKING: 'RANKING',
  SETNAME: 'SETNAME'
}

function trigger(message) {
  const trimmed = message.trim()
  if (trimmed.length > 500) {
    return null
  }
  if (trimmed === 'ランキング') {
    return actionDef.RANKING
  }
  if (trimmed.startsWith('名前変更')) {
    return actionDef.SETNAME
  }
  const words = ['遅刻', '欠席']
  for (const word of words) {
    if (trimmed.includes(word)) {
      return actionDef.COUNT
    }
  }
  return null
}

function countAbsentLate(text) {
  let result = {
    absent: 0,
    late: 0
  }
  if (text.length > 500) {
    return res
  }
  const lineArray = text.split(/[\n]+/)
  lineArray.forEach((elem) => {
    const lineResult = analyze(elem)
    result.late += lineResult.late
    result.absent += lineResult.absent
  })
  return result
}

function absentLateIndex(text) {
  return {
    absent: text.indexOf('欠席'),
    late: text.indexOf('遅刻')
  }
}

function analyze(text) {
  let res = {
    absent: 0,
    late: 0
  }
  const {absent, late} = absentLateIndex(text)
  // 両方ない
  if (absent === -1 && late === -1) {
    return res
  }
  // 欠席のみある
  if ( absent > -1 && late === -1 ) {
    res.absent = analyzeFirstInt(text.slice(absent + 2))
    return res
  }
  // 遅刻のみある
  if ( absent === -1 && late > -1 ) {
    res.late = analyzeFirstInt(text.slice(late + 2))
    return res
  }
  // 両方ある場合
  // 遅刻と欠席の間に1文字以上ないと解析不可
  if (Math.abs(absent - late) < 3) {
    return res
  }
  if ( absent < late ) {
    res.absent = analyzeFirstInt(text.slice(absent + 2, late))
    res.late = analyzeFirstInt(text.slice(late + 2))
    return res
  }
  if ( late < absent ) {
    res.late = analyzeFirstInt(text.slice(late + 2, absent))
    res.absent = analyzeFirstInt(text.slice(absent + 2))
    return res
  }
}

function analyzeFirstInt(text) {
  const array = text.split(/[^-\d]+/)
  for(let i = 0; i < array.length; i++) {
    const number = Number(array[i])
    if (Number.isInteger(number) && number !== 0) {
      return number
    }
  }
  return 0
}

function detectDisplayName(text) {
  if (text.startsWith('名前変更')) {
    const name = text.slice(4).trim().replace(/[\s]+/, ' ')
    if (name.length > 0 && name.length < 30) {
      return name
    }
  }
  return null
}

module.exports = {
  actionDef: actionDef,
  trigger: trigger,
  count: countAbsentLate,
  detectName: detectDisplayName
}