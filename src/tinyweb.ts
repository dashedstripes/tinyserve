export class Context {
    request: Request
    url: string

    constructor(request: Request) {
        this.request = request
        this.url = new URL(request.url).pathname
    }

    html(html: string) {
        return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        })
    }

    text(text: string) {
        return new Response(text, {
            headers: { 'Content-Type': 'text/plain' }
        })
    }

    json(data: any) {
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

export class Tinyweb {

    routes: { path: string, handler: (c: Context) => Promise<Response> }[]

    constructor() {
        this.routes = []
    }

    get(path: string, handler: (c: Context) => Promise<Response>) {
        this.routes.push({ path, handler })
    }

    async fetch(request: Request) {
        const context = new Context(request)
        return await this.handleRequest(context);
    }

    async handleRequest(c: Context) {
        const { url } = c
        for (const route of this.routes) {
            if (route.path === url) {
                return route.handler(c)
            }
        }
        return new Response('Not Found', { status: 404 })
    }
}