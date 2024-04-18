import { Tinyweb }  from '../src/index'

const app = new Tinyweb()

app.get('/', async (c) => {
  return c.text('Hello, TinyWeb!')
})

app.get('/test', async (c) => {
  return c.html(`
    <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Test Page</h1>
        <p>This is a test page.</p>
      </body>
    </html>
  `)
})

app.get('/api', async (c) => {
  return c.json({
    message: "Hello, World!"
  })
})

export default app