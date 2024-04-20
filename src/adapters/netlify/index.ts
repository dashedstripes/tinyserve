import type { Tinyserve } from '../../tinyserve'

export const handler = (app: Tinyserve) => {
  return (req: Request) => {
    return app.fetch(req)
  }
}