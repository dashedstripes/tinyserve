import { Tinyserve }  from '../src/index'

const app = new Tinyserve()

app.get('/', async (c) => {
  return c.text('Hello, Tinyserve!')
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

app.post('/api', async (c) => {
  return c.json({
    message: "Hello, World!"
  })
})

export default app