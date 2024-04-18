import type { Context } from "@netlify/functions"
import app from "../app";

export default async (req: Request, context: Context) => {
  return app.fetch(req);
}
