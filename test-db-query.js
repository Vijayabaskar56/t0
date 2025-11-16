import { db } from './src/db/index.ts';
import { categories } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function testQuery() {
  try {
    console.log('Testing database connection...');
    
    // Test basic query first
    const allCategories = await db.query.categories.findMany();
    console.log('All categories:', allCategories);
    
    // Test specific query
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, 'canvas-and-surfaces'),
      with: {
        subcollections: {
          with: {
            subcategories: true,
          },
        },
      },
    });
    console.log('Canvas category:', category);
    
    // Test raw SQL
    const rawResult = await db.run('SELECT * FROM categories WHERE slug = ?', ['canvas-and-surfaces']);
    console.log('Raw query result:', rawResult);
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

testQuery();
