import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, sql, and } from 'drizzle-orm';
import { db, categories, products } from '@/db';
import { NotFoundError } from '@/middleware/errorHandler';

interface CategoryParams {
  id: string;
}

const CategorySchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Tacos' },
    slug: { type: 'string', example: 'tacos' },
    description: { type: 'string', example: 'Classic Mexican tacos' },
    image_url: { type: 'string', nullable: true },
    display_order: { type: 'integer', example: 1 },
    created_at: { type: 'string', format: 'date-time' },
    product_count: { type: 'integer', example: 6 },
  },
};

const ProductInCategorySchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Pixel Carne Asada Taco' },
    slug: { type: 'string', example: 'pixel-carne-asada-taco' },
    description: { type: 'string' },
    price: { type: 'number', example: 4.49 },
    image_url: { type: 'string', nullable: true },
    category_id: { type: 'integer' },
    is_available: { type: 'boolean', example: true },
    is_featured: { type: 'boolean', example: false },
    spice_level: { type: 'integer', example: 2 },
    prep_time_minutes: { type: 'integer', example: 10 },
    calories: { type: 'integer', nullable: true },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

export default async function categoriesRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /categories - List all categories with product count
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Categories'],
        summary: 'List categories',
        description: 'Returns all categories with available product counts.',
        response: {
          200: {
            description: 'Category list',
            type: 'object',
            properties: {
              categories: { type: 'array', items: CategorySchema },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const result = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          imageUrl: categories.imageUrl,
          displayOrder: categories.displayOrder,
          createdAt: categories.createdAt,
          productCount: sql<number>`count(${products.id})::int`,
        })
        .from(categories)
        .leftJoin(
          products,
          and(
            eq(categories.id, products.categoryId),
            eq(products.isAvailable, true)
          )
        )
        .groupBy(categories.id)
        .orderBy(categories.displayOrder, categories.name);

      return reply.send({
        categories: result.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image_url: c.imageUrl,
          display_order: c.displayOrder,
          created_at: c.createdAt,
          product_count: c.productCount,
        })),
      });
    }
  );

  // GET /categories/:id - Get single category with products
  fastify.get<{ Params: CategoryParams }>(
    '/:id',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Get category with products',
        description: 'Returns category details along with all available products. Accepts ID or slug.',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Category ID or slug (e.g. `1` or `tacos`)' },
          },
        },
        response: {
          200: {
            description: 'Category with available products',
            type: 'object',
            properties: {
              category: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  name: { type: 'string', example: 'Tacos' },
                  slug: { type: 'string', example: 'tacos' },
                  description: { type: 'string' },
                  image_url: { type: 'string', nullable: true },
                  display_order: { type: 'integer' },
                  created_at: { type: 'string', format: 'date-time' },
                  products: { type: 'array', items: ProductInCategorySchema },
                },
              },
            },
          },
          404: {
            description: 'Category not found',
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: CategoryParams }>, reply: FastifyReply) => {
      const { id } = request.params;

      // Support both id and slug
      const category = await db.query.categories.findFirst({
        where: isNaN(Number(id))
          ? eq(categories.slug, id)
          : eq(categories.id, parseInt(id)),
      });

      if (!category) {
        throw new NotFoundError('Category');
      }

      // Get products in this category
      const categoryProducts = await db.query.products.findMany({
        where: and(
          eq(products.categoryId, category.id),
          eq(products.isAvailable, true)
        ),
        orderBy: products.name,
      });

      return reply.send({
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.imageUrl,
          display_order: category.displayOrder,
          created_at: category.createdAt,
          products: categoryProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: parseFloat(p.price),
            image_url: p.imageUrl,
            category_id: p.categoryId,
            is_available: p.isAvailable,
            is_featured: p.isFeatured,
            spice_level: p.spiceLevel,
            prep_time_minutes: p.prepTimeMinutes,
            calories: p.calories,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          })),
        },
      });
    }
  );
}
