const AWS = require('aws-sdk')

const dynamo = new AWS.DynamoDB({
  region: 'ap-northeast-1',
  apiVersion: '2012-08-10',
  accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID,
  secretAccessKey: process.env.DYNAMO_SECRET_ACCESS_KEY
})
const tableName = 'line_bot'

async function getData(userId) {
  const params = {
    TableName: tableName,
    Key: {
      '_id': {
        S: userId
      }
    }
  }
  try {
    item = await dynamo.getItem(params).promise()
    return item
  } catch(err) {
    console.error(err)
    return 1
  }
}

async function createData(userId, initialCounts = {}, name = '名無し') {
  const params = {
    TableName: tableName,
    Item: {
      '_id': {
        S: userId
      },
      'data': {
        M: {
          'absent': {
            N: String(initialCounts.absent)
          },
          'late': {
            N: String(initialCounts.late)
          },
          'displayName': {
            S: name
          }
        }
      }
    }
  }
  try {
    const res = await dynamo.putItem(params).promise()
    return res
  } catch(err) {
    console.error(err)
    return 1
  }
}

async function updateData(userId, counts) {
  const params = {
    TableName: tableName,
    Key: {
      '_id': {
        S: userId
      }
    },
    ExpressionAttributeNames: {
      '#D': 'data',
      '#A': 'absent',
      '#L': 'late'
    },
    ExpressionAttributeValues: {
      ':absent': {N: String(counts.absent)},
      ':late': {N: String(counts.late)}
    },
    UpdateExpression: 'SET #D.#A = :absent, #D.#L = :late',
    ReturnValues: 'UPDATED_NEW'
  }
  try {
    const res = await dynamo.updateItem(params).promise()
    return res
  } catch(err) {
    console.error(err)
    return 1
  }
}
async function setName(userId, name) {
  const params = {
    TableName: tableName,
    Key: {
      '_id': {
        S: userId
      }
    },
    ExpressionAttributeNames: {
      '#D': 'data',
      '#N': 'displayName'
    },
    ExpressionAttributeValues: {
      ':name': {S: name}
    },
    UpdateExpression: 'SET #D.#N = :name',
    ReturnValues: 'UPDATED_NEW'
  }
  try {
    const res = await dynamo.updateItem(params).promise()
    return res
  } catch(err) {
    console.error(err)
    return 1
  }
}

function scan() {
  const params = {
    TableName: tableName
  }
  try {
    const res = await dynamo.scan(params).promise()
    return res
  } catch(err) {
    console.error(err)
    return 1
  }
}

module.exports = {
  get: getData,
  create: createData,
  update: updateData,
  setName: setName,
  scan: scan
}