import { faker } from "@faker-js/faker";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		const db = drizzle(env.tanstack_fast_db, { schema });
		const url = new URL(request.url);
		const path = url.pathname;

		// SEED ENDPOINT
		if (path === "/seed") {
			try {
				console.log("🌱 Starting database seeding...");
				console.log("🗑️  Clearing existing data...");

				// Clear in reverse order due to FK constraints
				await db.delete(schema.products);
				await db.delete(schema.subcategories);
				await db.delete(schema.subcollections);
				await db.delete(schema.categories);
				await db.delete(schema.collections);

				console.log("✅ Data cleared");
				console.log("📦 Generating collections...");

				// Generate collections
				const collectionNames = [
					"Electronics",
					"Fashion",
					"Home & Garden",
					"Sports & Outdoors",
					"Books & Media",
					"Toys & Games",
					"Health & Beauty",
					"Automotive",
					"Food & Beverages",
					"Office Supplies",
				];

				const collections = [];
				for (let i = 0; i < 100; i++) {
					const baseName = faker.helpers.arrayElement(collectionNames);
					const name = `${baseName} ${faker.commerce.department()}`;
					const slug = `${faker.helpers.slugify(name.toLowerCase())}-${i}`;
					const result = await db
						.insert(schema.collections)
						.values({ name, slug })
						.returning();
					collections.push(result[0]);
				}
				console.log(`✅ Created ${collections.length} collections`);

				// Generate categories
				console.log("🏷️  Generating categories...");
				const categories = [];
				for (let i = 0; i < 200; i++) {
					const name = `${faker.commerce.productAdjective()} ${faker.commerce.product()}`;
					const slug = `${faker.helpers.slugify(name.toLowerCase())}-${i}`;
					const collectionId = faker.helpers.arrayElement(collections).id;
					const imageUrl = faker.image.url({ width: 800, height: 600 });
					const result = await db
						.insert(schema.categories)
						.values({ name, slug, collectionId, imageUrl })
						.returning();
					categories.push(result[0]);
				}
				console.log(`✅ Created ${categories.length} categories`);

				// Generate subcollections
				console.log("📁 Generating subcollections...");
				const subcollections = [];
				for (let i = 0; i < 300; i++) {
					const name = `${faker.commerce.productMaterial()} ${faker.commerce.product()}`;
					const categoryId = faker.helpers.arrayElement(categories).id;
					const result = await db
						.insert(schema.subcollections)
						.values({ name, categoryId })
						.returning();
					subcollections.push(result[0]);
				}
				console.log(`✅ Created ${subcollections.length} subcollections`);

				// Generate subcategories
				console.log("🔖 Generating subcategories...");
				const subcategories = [];
				for (let i = 0; i < 400; i++) {
					const name = `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`;
					const slug = `${faker.helpers.slugify(name.toLowerCase())}-${i}`;
					const subcollectionId = faker.helpers.arrayElement(subcollections).id;
					const imageUrl = faker.image.url({ width: 800, height: 600 });
					const result = await db
						.insert(schema.subcategories)
						.values({ name, slug, subcollectionId, imageUrl })
						.returning();
					subcategories.push(result[0]);
				}
				console.log(`✅ Created ${subcategories.length} subcategories`);

				// Generate products
				console.log("🛍️  Generating products...");
				const products = [];
				for (let i = 0; i < 500; i++) {
					const name = faker.commerce.productName();
					const slug = `${faker.helpers.slugify(name.toLowerCase())}-${i}`;
					const description = faker.commerce.productDescription();
					const price = Number(
						faker.commerce.price({ min: 10, max: 5000, dec: 2 }),
					);
					const subcategoryId = faker.helpers.arrayElement(subcategories).id;
					const imageUrl = faker.image.url({ width: 800, height: 600 });
					const result = await db
						.insert(schema.products)
						.values({ name, slug, description, price, subcategoryId, imageUrl })
						.returning();
					products.push(result[0]);
				}
				console.log(`✅ Created ${products.length} products`);

				const summary = `✅ Seeding complete!
📊 Summary:
  - Collections: ${collections.length}
  - Categories: ${categories.length}
  - Subcollections: ${subcollections.length}
  - Subcategories: ${subcategories.length}
  - Products: ${products.length}`;

				console.log(summary);
				return new Response(summary, {
					status: 200,
					headers: { "Content-Type": "text/plain" },
				});
			} catch (error) {
				console.error("❌ Error seeding database:", error);
				return new Response(`Error: ${error}`, {
					status: 500,
					headers: { "Content-Type": "text/plain" },
				});
			}
		}

		// DATABASE VIEWER
		if (path === "/") {
			return new Response(
				`<!DOCTYPE html>
<html>
<head>
  <title>D1 Admin Panel</title>
  <style>
    body { font-family: system-ui; padding: 20px; max-width: 1400px; margin: 0 auto; background: #f8f9fa; }
    h1 { color: #333; }
    .actions { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
    .actions button { margin-right: 15px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
    .actions button:hover { background: #c82333; }
    .nav { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
    .nav a { margin-right: 15px; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
    .nav a:hover { background: #0052a3; }
    #result { margin-top: 20px; padding: 15px; background: white; border-radius: 8px; display: none; }
  </style>
</head>
<body>
  <h1>📊 D1 Admin Panel</h1>

  <div class="actions">
    <h2>🌱 Seed Database</h2>
    <button onclick="seedDB()">Run Seed (100 collections, 200 categories, 300 subcollections, 400 subcategories, 500 products)</button>
    <div id="result"></div>
  </div>

  <div class="nav">
    <h2>📁 Browse Data</h2>
    <a href="/collections">Collections</a>
    <a href="/categories">Categories</a>
    <a href="/subcollections">Subcollections</a>
    <a href="/subcategories">Subcategories</a>
    <a href="/products">Products</a>
  </div>

  <script>
    async function seedDB() {
      const btn = event.target;
      const result = document.getElementById('result');
      btn.disabled = true;
      btn.textContent = 'Seeding... (this takes ~30 seconds)';
      result.style.display = 'block';
      result.textContent = 'Please wait...';

      try {
        const response = await fetch('/seed');
        const text = await response.text();
        result.textContent = text;
        result.style.color = response.ok ? 'green' : 'red';
      } catch (error) {
        result.textContent = 'Error: ' + error.message;
        result.style.color = 'red';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Run Seed';
      }
    }
  </script>
</body>
</html>`,
				{ headers: { "Content-Type": "text/html" } },
			);
		}

		// TABLE VIEWERS
		let data: any[] = [];
		let tableName = "";

		if (path === "/collections") {
			data = await db.select().from(schema.collections).limit(100).all();
			tableName = "Collections";
		} else if (path === "/categories") {
			data = await db.select().from(schema.categories).limit(100).all();
			tableName = "Categories";
		} else if (path === "/subcollections") {
			data = await db.select().from(schema.subcollections).limit(100).all();
			tableName = "Subcollections";
		} else if (path === "/subcategories") {
			data = await db.select().from(schema.subcategories).limit(100).all();
			tableName = "Subcategories";
		} else if (path === "/products") {
			data = await db.select().from(schema.products).limit(100).all();
			tableName = "Products";
		}

		if (!data.length) {
			return new Response("No data or invalid path", { status: 404 });
		}

		const keys = Object.keys(data[0]);
		const rows = data
			.map(
				(row) =>
					`<tr>${keys.map((key) => `<td>${row[key] ?? ""}</td>`).join("")}</tr>`,
			)
			.join("");

		return new Response(
			`<!DOCTYPE html>
<html>
<head>
  <title>${tableName} - D1 Admin</title>
  <style>
    body { font-family: system-ui; padding: 20px; max-width: 1400px; margin: 0 auto; background: #f8f9fa; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; background: white; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; position: sticky; top: 0; }
    tr:hover { background: #f9f9f9; }
    .count { color: #666; font-size: 14px; margin-top: 10px; }
    .back { display: inline-block; margin-bottom: 15px; padding: 8px 16px; background: #6c757d; color: white; text-decoration: none; border-radius: 4px; }
    .back:hover { background: #5a6268; }
  </style>
</head>
<body>
  <a href="/" class="back">← Back to Admin</a>
  <h1>${tableName}</h1>
  <div class="count">Showing ${data.length} records (max 100)</div>
  <table>
    <thead><tr>${keys.map((key) => `<th>${key}</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`,
			{ headers: { "Content-Type": "text/html" } },
		);
	},
};
