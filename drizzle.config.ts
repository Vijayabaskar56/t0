import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config()

// D1 local database path
const D1_DB_PATH = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce7b06e6140159768f908a262c0b5cfafca9aeba02ff3e32f57c028aed46c271.sqlite'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: D1_DB_PATH,
  },
})
