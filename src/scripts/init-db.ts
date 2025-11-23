import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

// Find the D1 database dynamically
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

async function initDatabase() {
	console.log("🔧 Initializing database schema...");

	try {
		const dbPath = findD1DatabasePath();
		console.log(`📂 Using database: ${dbPath}`);
		const sqlite = new Database(dbPath);

		// Read and execute the migration file
		const migrationSQL = readFileSync(
			"./drizzle/0000_yellow_jackal.sql",
			"utf-8",
		);

		// Split the SQL into individual statements
		const statements = migrationSQL
			.split("--> statement-breakpoint")
			.map((s) => s.trim())
			.filter((s) => s);

		console.log(`📋 Executing ${statements.length} SQL statements...`);

		for (const statement of statements) {
			try {
				sqlite.exec(statement);
			} catch (error: unknown) {
				if (
					error instanceof Error &&
					"code" in error &&
					error.code === "SQLITE_ERROR" &&
					error.message.includes("already exists")
				) {
					console.log(`⚠️  Table already exists, skipping...`);
				} else {
					throw error;
				}
			}
		}

		sqlite.close();
		console.log("✅ Database schema initialized successfully!");
	} catch (error) {
		console.error("❌ Error initializing database:", error);
		process.exit(1);
	}
}

initDatabase().catch(console.error);
