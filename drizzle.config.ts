import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

config()

// Find the D1 database dynamically (same logic as seed script)
function findD1DatabasePath(): string {
	const wranglerDir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
	
	if (!existsSync(wranglerDir)) {
		throw new Error(
			"D1 database directory not found. Please run `pnpm run dev` first to initialize the database.",
		);
	}
	
	const files = readdirSync(wranglerDir);
	const sqliteFile = files.find((file) => file.endsWith(".sqlite"));
	
	if (!sqliteFile) {
		throw new Error(
			"No SQLite database file found in D1 directory. Please run `pnpm run dev` first.",
		);
	}
	
	return join(wranglerDir, sqliteFile);
}

const D1_DB_PATH = findD1DatabasePath()

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: D1_DB_PATH,
  },
})
