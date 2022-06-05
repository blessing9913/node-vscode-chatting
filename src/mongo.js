// @ts-check

const { MongoClient, ServerApiVersion } = require('mongodb')

const dotenv = require('dotenv')

let path
switch (process.env.NODE_ENV) {
  case 'prod':
    path = `${__dirname}/../.env.prod`
    break
  case 'dev':
    path = `${__dirname}/../.env.dev`
    break
  default:
    path = `${__dirname}/../.env.dev`
}
dotenv.config({ path }) // path 설정

const { DB_URI, DB_NAME } = process.env

// const uri = `mongodb+srv://admin:${process.env.MONGO_PASSWORD}@cluster0.cpyqv.mongodb.net/?retryWrites=true&w=majority`
// const uri = DB_URI

if (!DB_URI) {
  throw new Error('DB URI Not foud')
}

const client = new MongoClient(DB_URI, {
  serverApi: ServerApiVersion.v1,
})

module.exports = client
