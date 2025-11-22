import { faker } from "@faker-js/faker";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema.ts";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

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

function slugify(text: string, suffix?: string): string {
	const base = text
		.toLowerCase()
		.replace(/[^a-z0-9 -]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim();
	return suffix ? `${base}-${suffix}` : base;
}

function generateCollectionName(): string {
	const themes = [
		"Modern",
		"Classic",
		"Vintage",
		"Contemporary",
		"Minimalist",
		"Luxury",
		"Eco-Friendly",
		"Industrial",
		"Rustic",
		"Urban",
	];
	const types = ["Collection", "Series", "Line", "Edition", "Gallery"];
	return `${faker.helpers.arrayElement(themes)} ${faker.helpers.arrayElement(types)}`;
}

function generateCategoryName(): string {
	const categories = [
		"Electronics",
		"Furniture",
		"Clothing",
		"Home Decor",
		"Kitchen",
		"Bathroom",
		"Office",
		"Lighting",
		"Storage",
		"Outdoor",
		"Bedroom",
		"Living Room",
		"Dining",
		"Accessories",
		"Tools",
		"Sports",
		"Books",
		"Toys",
		"Garden",
		"Pet Supplies",
	];
	return faker.helpers.arrayElement(categories);
}

function generateSubcategoryName(): string {
	const adjectives = [
		"Premium",
		"Deluxe",
		"Standard",
		"Professional",
		"Casual",
	];
	const items = ["Series", "Collection", "Line", "Set", "Range"];
	return `${faker.helpers.arrayElement(adjectives)} ${faker.commerce.productMaterial()} ${faker.helpers.arrayElement(items)}`;
}

function generateProductName(): string {
	const materials = [
		"Wooden",
		"Metal",
		"Plastic",
		"Glass",
		"Ceramic",
		"Fabric",
		"Leather",
	];
	const types = [
		"Chair",
		"Table",
		"Lamp",
		"Shelf",
		"Cabinet",
		"Desk",
		"Sofa",
		"Bed",
		"Storage",
		"Decor",
	];
	const qualifiers = [
		"Modern",
		"Classic",
		"Elegant",
		"Compact",
		"Spacious",
		"Adjustable",
	];

	return `${faker.helpers.arrayElement(qualifiers)} ${faker.helpers.arrayElement(materials)} ${faker.helpers.arrayElement(types)}`;
}

function generatePrice(): string {
	const min = 10;
	const max = 2000;
	const price = faker.number.float({ min, max, fractionDigits: 2 });
	return price.toString();
}

async function seedDatabase() {
	console.log("🌱 Starting database seeding...");

	try {
		// Initialize database connection with dynamic path
		const dbPath = findD1DatabasePath();
		console.log(`📂 Using database: ${dbPath}`);
		const sqlite = new Database(dbPath);
		const db = drizzle(sqlite, { schema });

		// Check if tables exist, if not run migrations
		const tables = sqlite
			.prepare("SELECT name FROM sqlite_master WHERE type='table'")
			.all() as { name: string }[];
		const tableNames = tables.map((t) => t.name);

		if (!tableNames.includes("collections")) {
			console.log("📋 Tables not found. Please run:");
			console.log("   pnpm run db:init");
			process.exit(1);
		}

		// Clear existing data
		console.log("🗑️  Clearing existing data...");
		await db.delete(schema.products);
		await db.delete(schema.subcategories);
		await db.delete(schema.subcollections);
		await db.delete(schema.categories);
		await db.delete(schema.collections);

		// Seed Collections
		console.log("📦 Creating collections...");
		const collections: (typeof schema.collections.$inferInsert)[] = [];
		for (let i = 0; i < 10; i++) {
			const name = generateCollectionName();
			collections.push({
				name,
				slug: slugify(name),
			});
		}
		const insertedCollections = await db
			.insert(schema.collections)
			.values(collections)
			.returning();
		console.log(`✅ Created ${insertedCollections.length} collections`);

		// Seed Categories
		console.log("📂 Creating categories...");
		const categories: (typeof schema.categories.$inferInsert)[] = [];
		const usedCategorySlugs = new Set<string>();
		for (let i = 0; i < 20; i++) {
			const name = generateCategoryName();
			let slug = slugify(name);
			let counter = 1;

			while (usedCategorySlugs.has(slug)) {
				slug = slugify(name, counter.toString());
				counter++;
			}

			usedCategorySlugs.add(slug);
			const collection = faker.helpers.arrayElement(insertedCollections);
			categories.push({
				name,
				slug,
				collectionId: collection.id,
				imageUrl: "/placeholder.webp",
			});
		}
		const insertedCategories = await db
			.insert(schema.categories)
			.values(categories)
			.returning();
		console.log(`✅ Created ${insertedCategories.length} categories`);

		// Seed Subcollections
		console.log("📁 Creating subcollections...");
		const subcollections: (typeof schema.subcollections.$inferInsert)[] = [];
		for (let i = 0; i < 15; i++) {
			const category = faker.helpers.arrayElement(insertedCategories);
			subcollections.push({
				name: generateSubcategoryName(),
				categorySlug: category.slug,
			});
		}
		const insertedSubcollections = await db
			.insert(schema.subcollections)
			.values(subcollections)
			.returning();
		console.log(`✅ Created ${insertedSubcollections.length} subcollections`);

		// Seed Subcategories
		console.log("📋 Creating subcategories...");
		const subcategories: (typeof schema.subcategories.$inferInsert)[] = [];
		const usedSubcategorySlugs = new Set<string>();
		for (let i = 0; i < 30; i++) {
			const name = generateSubcategoryName();
			let slug = slugify(name);
			let counter = 1;

			while (usedSubcategorySlugs.has(slug)) {
				slug = slugify(name, counter.toString());
				counter++;
			}

			usedSubcategorySlugs.add(slug);
			const subcollection = faker.helpers.arrayElement(insertedSubcollections);
			subcategories.push({
				name,
				slug,
				subcollectionId: subcollection.id,
				imageUrl: "/placeholder.webp",
			});
		}
		const insertedSubcategories = await db
			.insert(schema.subcategories)
			.values(subcategories)
			.returning();
		console.log(`✅ Created ${insertedSubcategories.length} subcategories`);

		// Seed Products
		console.log("🛍️  Creating products...");
		const products: (typeof schema.products.$inferInsert)[] = [];
		const usedProductSlugs = new Set<string>();
		for (let i = 0; i < 500; i++) {
			const name = generateProductName();
			let slug = slugify(name);
			let counter = 1;

			while (usedProductSlugs.has(slug)) {
				slug = slugify(name, counter.toString());
				counter++;
			}

			usedProductSlugs.add(slug);
			const subcategory = faker.helpers.arrayElement(insertedSubcategories);
			products.push({
				name,
				slug,
				description: faker.commerce.productDescription(),
				price: generatePrice(),
				subcategorySlug: subcategory.slug,
				imageUrl: "/placeholder.webp",
			});
		}

		// Insert products in batches for better performance
		const batchSize = 50;
		let totalInserted = 0;
		for (let i = 0; i < products.length; i += batchSize) {
			const batch = products.slice(i, i + batchSize);
			await db.insert(schema.products).values(batch);
			totalInserted += batch.length;
			console.log(
				`📊 Progress: ${totalInserted}/${products.length} products inserted`,
			);
		}

		console.log(`✅ Created ${totalInserted} products`);

		// Update FTS table (if it exists)
		try {
			console.log("🔍 Updating full-text search table...");
			const allProducts = await db.select().from(schema.products);
			const ftsInserts = allProducts.map((product) => ({
				slug: product.slug,
				name: product.name,
			}));

			for (let i = 0; i < ftsInserts.length; i += batchSize) {
				const batch = ftsInserts.slice(i, i + batchSize);
				await db.insert(schema.productsFts).values(batch);
			}

			console.log(`✅ Updated FTS table with ${ftsInserts.length} entries`);
		} catch (_error) {
			console.log("⚠️  FTS table not found, skipping full-text search update");
		}

		sqlite.close();
		console.log("🎉 Database seeding completed successfully!");

		// Summary
		console.log("\n📈 Seeding Summary:");
		console.log(`- Collections: ${insertedCollections.length}`);
		console.log(`- Categories: ${insertedCategories.length}`);
		console.log(`- Subcollections: ${insertedSubcollections.length}`);
		console.log(`- Subcategories: ${insertedSubcategories.length}`);
		console.log(`- Products: ${totalInserted}`);
	} catch (error) {
		console.error("❌ Error during seeding:", error);
		process.exit(1);
	}
}

// Run the seed function
seedDatabase().catch(console.error);
