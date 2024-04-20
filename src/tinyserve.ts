const splitByStarRe = /\*/
const splitPathRe = /\/(:\w+(?:{(?:(?:{[\d,]+})|[^}])+})?)|\/[^\/\?]+|(\?)/g

type RegExpMatchArrayWithIndices = RegExpMatchArray & { indices: [number, number][] }


export class Context {
  req: Request
  url: string
  method: string
  params: Record<string, string> = {}

  constructor(request: Request) {
    this.req = request
    this.url = new URL(request.url).pathname
    this.method = request.method
    this.params = {}
  }

  setParams(params: Record<string, string>) {
    this.params = params
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

  match(method: string, path: string) {
    // handlers = [handler, params][]
    const handlers: [RouteHandler, Record<string, string>][] = []
    /**
     * will return:
     * 
     * [handler, params][]
     */

    ROUTES_LOOP: for(let i = 0; i < this.routes.length; i++) {
      const [routeMethod, routePath, handler] = this.routes[i];

      if (routeMethod !== method) {
        continue
      }

      if (routePath === '*' || routePath === '/*') {
        handlers.push([handler, {}])
        continue
      }

      const hasStar = routePath.indexOf('*') !== -1
      const hasLabel = routePath.indexOf(':') !== -1

      if (!hasStar && !hasLabel) {
        if (routePath === path || routePath + '/' === path) {
          handlers.push([handler, {}])
        }
      } else if(hasStar && !hasLabel) {
        const endsWithStar = routePath.charCodeAt(routePath.length - 1) === 42
        const parts = (endsWithStar ? routePath.slice(0, -2) : routePath).split(splitByStarRe)

        const lastIndex = parts.length - 1
        for (let j = 0, pos = 0, len = parts.length; j < len; j++) {
          const part = parts[j]
          const index = path.indexOf(part, pos)
          if (index !== pos) {
            continue ROUTES_LOOP
          }
          pos += part.length
          if (j === lastIndex) {
            if (
              !endsWithStar &&
              pos !== path.length &&
              !(pos === path.length - 1 && path.charCodeAt(pos) === 47)
            ) {
              continue ROUTES_LOOP
            }
          } else {
            const index = path.indexOf('/', pos)
            if (index === -1) {
              continue ROUTES_LOOP
            }
            pos = index
          }
        }
        handlers.push([handler, {}])
      } else if (hasLabel && !hasStar) {
        const params: Record<string, string> = Object.create(null)
        const parts = routePath.match(splitPathRe) as string[]

        const lastIndex = parts.length - 1
        for (let j = 0, pos = 0, len = parts.length; j < len; j++) {
          if (pos === -1 || pos >= path.length) {
            continue ROUTES_LOOP
          }

          const part = parts[j]
          if (part.charCodeAt(1) === 58) {
            // /:label
            let name = part.slice(2)
            let value

            if (name.charCodeAt(name.length - 1) === 125) {
              // :label{pattern}
              const openBracePos = name.indexOf('{')
              const pattern = name.slice(openBracePos + 1, -1)
              const restPath = path.slice(pos + 1)
              const match = new RegExp(pattern, 'd').exec(restPath) as RegExpMatchArrayWithIndices
              if (!match || match.indices[0][0] !== 0 || match.indices[0][1] === 0) {
                continue ROUTES_LOOP
              }
              name = name.slice(0, openBracePos)
              value = restPath.slice(...match.indices[0])
              pos += match.indices[0][1] + 1
            } else {
              let endValuePos = path.indexOf('/', pos + 1)
              if (endValuePos === -1) {
                if (pos + 1 === path.length) {
                  continue ROUTES_LOOP
                }
                endValuePos = path.length
              }
              value = path.slice(pos + 1, endValuePos)
              pos = endValuePos
            }

            params[name] ||= value as string
          } else {
            const index = path.indexOf(part, pos)
            if (index !== pos) {
              continue ROUTES_LOOP
            }
            pos += part.length
          }

          if (j === lastIndex) {
            if (pos !== path.length && !(pos === path.length - 1 && path.charCodeAt(pos) === 47)) {
              continue ROUTES_LOOP
            }
          }
        }

        handlers.push([handler, params])
      } else if (hasLabel && hasStar) {
        throw new Error("Unsupported path")
      }
    }

    return handlers;
  }

  async handleRequest(c: Context) {
    const { url } = c

    const matches = this.match(c.method, url);

    if(matches.length === 0) {
      return new Response('Not Found', { status: 404 })
    }

    c.setParams(matches[0][1]);
    
    return await matches[0][0](c);
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

  put(path: string, handler: RouteHandler) {
    this.router.add("PUT", path, handler)
  }

  patch(path: string, handler: RouteHandler) {
    this.router.add("PATCH", path, handler)
  }

  post(path: string, handler: RouteHandler) {
    this.router.add("POST", path, handler)
  }

  delete(path: string, handler: RouteHandler) {
    this.router.add("DELETE", path, handler)
  }

  async fetch(request: Request) {
    const context = new Context(request)
    return await this.router.handleRequest(context);
  }
}