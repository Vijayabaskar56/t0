-- Create FTS5 virtual table for product search
CREATE VIRTUAL TABLE products_fts USING fts5(slug UNINDEXED, name);

-- Populate from existing products
INSERT INTO products_fts(slug, name) SELECT slug, name FROM products;

-- Trigger: sync on INSERT
CREATE TRIGGER products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(slug, name) VALUES (new.slug, new.name);
END;

-- Trigger: sync on DELETE
CREATE TRIGGER products_ad AFTER DELETE ON products BEGIN
  DELETE FROM products_fts WHERE slug = old.slug;
END;

-- Trigger: sync on UPDATE
CREATE TRIGGER products_au AFTER UPDATE ON products BEGIN
  UPDATE products_fts SET name = new.name WHERE slug = new.slug;
END;
