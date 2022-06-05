// @ts-check

const Koa = require('koa')
const Pug = require('koa-pug')
const path = require('path')
const route = require('koa-route')
const serve = require('koa-static')
const websockify = require('koa-websocket')
const mount = require('koa-mount')
const mongoClient = require('./mongo')

// the magic happens right here
const app = websockify(new Koa())

// @ts-ignore
// eslint-disable-next-line no-new
new Pug({
  viewPath: path.resolve(__dirname, './views'),
  app,
})

app.use(mount('/public', serve('src/public')))

app.use(async (ctx) => {
  await ctx.render('main')
})

const { DB_NAME } = process.env
const client = mongoClient.connect()

async function getChatsCollection() {
  const clientPromise = await client
  return clientPromise.db(DB_NAME).collection('chats')
}

app.ws.use(
  route.all('/ws', async (ctx) => {
    const chatsCollection = await getChatsCollection()
    const chatsCursor = chatsCollection.find(
      {},
      {
        sort: {
          createdAt: 1,
        },
      }
    )

    const chats = await chatsCursor.toArray()
    ctx.websocket.send(
      JSON.stringify({
        type: 'sync',
        payload: {
          chats,
        },
      })
    )

    ctx.websocket.on('message', async (data, isBinary) => {
      const msg = isBinary ? data : data.toString()

      if (typeof msg !== 'string') {
        return
      }

      const chat = JSON.parse(msg)
      await chatsCollection.insertOne({
        ...chat,
        createAt: new Date(), // 나중에 추가된 채팅이 마지막에 오도록 정렬
      })

      const { nickname, message } = chat

      // 채팅에 참여한 모든 사람에게 브로드 캐시팅
      const { server } = app.ws

      if (!server) {
        return
      }

      server.clients.forEach((_client) => {
        _client.send(
          JSON.stringify({
            type: 'chat',
            payload: {
              nickname,
              message,
            },
          })
        )
      })
    })
  })
)

const PORT = 5000

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`)
})
