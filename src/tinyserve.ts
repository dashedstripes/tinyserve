export class Context {
    request: Request
    url: string
    method: string

    constructor(request: Request) {
        this.request = request
        this.url = new URL(request.url).pathname
        this.method = request.method
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

export type RouteHandler = (c: Context) => Promise<Response>;

export class Router {
    // method, path, handler
    routes: [string, string, RouteHandler][] = []

    constructor() {
        this.routes = []
    }

    add(method: string, path: string, handler: RouteHandler) {
        this.routes.push([method, path, handler])
    }

    match(path: string) {
        for (const route of this.routes) {
            if (route[1] === path) {
                return route
            }
        }
    }

    async handleRequest(c: Context) {
        const { url } = c
        for (const route of this.routes) {
            if (route[1] === url) {
                if(route[0] !== c.method) {
                    return new Response('Method Not Allowed', { status: 405 })
                }

                return route[2](c)
            }
        }
        return new Response('Not Found', { status: 404 })
    }
}

export class Tinyserve {
    router: Router;

    constructor() {
        this.router = new Router()
    }

    get(path: string, handler: RouteHandler) {
        this.router.add("GET", path, handler)
    }

    post(path: string, handler: RouteHandler) {
        this.router.add("POST", path, handler)
    }

    async fetch(request: Request) {
        const context = new Context(request)
        return await this.router.handleRequest(context);
    }
}