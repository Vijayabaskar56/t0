import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema.ts'

export const getDb = () => {
  // const d1 = (globalThis as any).DB as D1Database
  // if (!d1) {
  //   throw new Error('D1 database not found. Make sure DB binding is configured in wrangler.jsonc')
  // }
  return drizzle(env.tanstack_fast_db, { schema })
}
