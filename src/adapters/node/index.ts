import http, { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import { Tinyserve } from "src/tinyserve";

export const handler = (app: Tinyserve) => {
  const host = 'localhost';
  const port = 8000;
  
  const server = http.createServer((request: IncomingMessage, response: ServerResponse) => {
    const headers = new Headers(request.headers as HeadersInit);
    const req = new Request(`http://${host}:${port}${request.url}`, {
      method: request.method,
      headers: headers,
    });
  
    app.fetch(req).then((res) => {
      response.statusCode = res.status;
  
      for (const [key, value] of res.headers) {
        response.setHeader(key, value);
      }
  
      if(res.body) {
        const reader = res.body.getReader();
        const stream = new Readable({
          async read() {
            const { done, value } = await reader.read();
            if (done) {
              this.push(null);
            } else {
              this.push(Buffer.from(value));
            }
          }
        });
        stream.pipe(response);
      } else {
        response.end();
      }
    }).catch((err) => {
      console.error('Error handling request:', err);
      response.statusCode = 500;
      response.end('Internal Server Error');
  
    });
  });
  
  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
}
