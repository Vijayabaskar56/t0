import { z } from 'zod'

export const CollectionSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  slug: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CategorySchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  slug: z.string(),
  collectionId: z.number().int().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const SubcollectionSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  categoryId: z.number().int().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const SubcategorySchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  slug: z.string(),
  subcollectionId: z.number().int().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const ProductSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price: z.number(),
  subcategoryId: z.number().int().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
