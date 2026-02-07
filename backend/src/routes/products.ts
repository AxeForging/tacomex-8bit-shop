import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, or, gte, lte, ilike, sql, asc, desc } from 'drizzle-orm';
import { db, products, categories, productOptions } from '../db';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { authenticateAdmin } from '../middleware/auth';

interface ProductsQuery {
  category?: string;
  featured?: string;
  available?: string;
  minPrice?: string;
  maxPrice?: string;
  spiceLevel?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
}

interface ProductParams {
  id: string;
}

export default async function productsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /products - List all products with filtering
  fastify.get<{ Querystring: ProductsQuery }>(
    '/',
    async (request: FastifyRequest<{ Querystring: ProductsQuery }>, reply: FastifyReply) => {
      const {
        category,
        featured,
        available,
        minPrice,
        maxPrice,
        spiceLevel,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        page = '1',
        limit = '20',
      } = request.query;

      // Build conditions
      const conditions = [];

      // Filter by category
      if (category) {
        const categoryRecord = await db.query.categories.findFirst({
          where: or(
            eq(categories.slug, category),
            isNaN(Number(category)) ? undefined : eq(categories.id, parseInt(category))
          ),
          columns: { id: true },
        });
        if (categoryRecord) {
          conditions.push(eq(products.categoryId, categoryRecord.id));
        }
      }

      // Filter by featured
      if (featured === 'true') {
        conditions.push(eq(products.isFeatured, true));
      }

      // Filter by availability
      if (available !== undefined) {
        conditions.push(eq(products.isAvailable, available === 'true'));
      }

      // Filter by price range
      if (minPrice) {
        conditions.push(gte(products.price, minPrice));
      }
      if (maxPrice) {
        conditions.push(lte(products.price, maxPrice));
      }

      // Filter by spice level
      if (spiceLevel) {
        conditions.push(eq(products.spiceLevel, parseInt(spiceLevel)));
      }

      // Search by name or description
      if (search) {
        conditions.push(
          or(
            ilike(products.name, `%${search}%`),
            ilike(products.description, `%${search}%`)
          )
        );
      }

      // Pagination
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      // Get sort column and order
      const validSortFields = ['name', 'price', 'created_at', 'spice_level', 'prep_time_minutes'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
      const sortDirection = sortOrder === 'desc' ? desc : asc;

      const sortColumn = {
        name: products.name,
        price: products.price,
        created_at: products.createdAt,
        spice_level: products.spiceLevel,
        prep_time_minutes: products.prepTimeMinutes,
      }[sortField] || products.name;

      // Build where clause
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause);
      const total = countResult?.count || 0;

      // Get products
      const productsResult = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          categoryId: products.categoryId,
          isAvailable: products.isAvailable,
          isFeatured: products.isFeatured,
          spiceLevel: products.spiceLevel,
          prepTimeMinutes: products.prepTimeMinutes,
          calories: products.calories,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .orderBy(sortDirection(sortColumn))
        .limit(limitNum)
        .offset(offset);

      // Get options for each product
      const productIds = productsResult.map((p) => p.id);
      let optionsMap: Record<number, typeof productOptions.$inferSelect[]> = {};

      if (productIds.length > 0) {
        const optionsResult = await db.query.productOptions.findMany({
          where: sql`${productOptions.productId} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`,
          orderBy: [productOptions.optionType, productOptions.name],
        });

        optionsMap = optionsResult.reduce((acc, opt) => {
          const pid = opt.productId!;
          if (!acc[pid]) acc[pid] = [];
          acc[pid].push(opt);
          return acc;
        }, {} as Record<number, typeof productOptions.$inferSelect[]>);
      }

      const formattedProducts = productsResult.map((p) => ({
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
        category_name: p.categoryName,
        category_slug: p.categorySlug,
        options: (optionsMap[p.id] || []).map((o) => ({
          id: o.id,
          product_id: o.productId,
          name: o.name,
          option_type: o.optionType,
          price_modifier: parseFloat(o.priceModifier || '0'),
          is_default: o.isDefault,
        })),
      }));

      return reply.send({
        products: formattedProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // GET /products/featured - Get featured products
  fastify.get(
    '/featured',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const result = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          categoryId: products.categoryId,
          isAvailable: products.isAvailable,
          isFeatured: products.isFeatured,
          spiceLevel: products.spiceLevel,
          prepTimeMinutes: products.prepTimeMinutes,
          calories: products.calories,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(eq(products.isFeatured, true), eq(products.isAvailable, true)))
        .orderBy(products.name)
        .limit(10);

      return reply.send({
        products: result.map((p) => ({
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
          category_name: p.categoryName,
          category_slug: p.categorySlug,
        })),
      });
    }
  );

  // GET /products/:id - Get single product
  fastify.get<{ Params: ProductParams }>(
    '/:id',
    async (request: FastifyRequest<{ Params: ProductParams }>, reply: FastifyReply) => {
      const { id } = request.params;

      // Support both id and slug
      const [productResult] = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          categoryId: products.categoryId,
          isAvailable: products.isAvailable,
          isFeatured: products.isFeatured,
          spiceLevel: products.spiceLevel,
          prepTimeMinutes: products.prepTimeMinutes,
          calories: products.calories,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          isNaN(Number(id))
            ? eq(products.slug, id)
            : eq(products.id, parseInt(id))
        )
        .limit(1);

      if (!productResult) {
        throw new NotFoundError('Product');
      }

      // Get options
      const options = await db.query.productOptions.findMany({
        where: eq(productOptions.productId, productResult.id),
        orderBy: [productOptions.optionType, productOptions.name],
      });

      return reply.send({
        product: {
          id: productResult.id,
          name: productResult.name,
          slug: productResult.slug,
          description: productResult.description,
          price: parseFloat(productResult.price),
          image_url: productResult.imageUrl,
          category_id: productResult.categoryId,
          is_available: productResult.isAvailable,
          is_featured: productResult.isFeatured,
          spice_level: productResult.spiceLevel,
          prep_time_minutes: productResult.prepTimeMinutes,
          calories: productResult.calories,
          created_at: productResult.createdAt,
          updated_at: productResult.updatedAt,
          category_name: productResult.categoryName,
          category_slug: productResult.categorySlug,
          options: options.map((o) => ({
            id: o.id,
            product_id: o.productId,
            name: o.name,
            option_type: o.optionType,
            price_modifier: parseFloat(o.priceModifier || '0'),
            is_default: o.isDefault,
          })),
        },
      });
    }
  );

  // POST /products - Create product (admin only)
  fastify.post(
    '/',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Body: Record<string, unknown> }>, reply: FastifyReply) => {
      const { name, description, price, categoryId, spiceLevel, isAvailable, isFeatured } = request.body as {
        name: string; description?: string; price: number; categoryId?: string;
        spiceLevel?: number; isAvailable?: boolean; isFeatured?: boolean;
      };

      if (!name || price === undefined) {
        throw new ValidationError('Name and price are required');
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const [newProduct] = await db.insert(products).values({
        name,
        slug,
        description: description || null,
        price: price.toString(),
        categoryId: categoryId ? parseInt(categoryId) : null,
        spiceLevel: spiceLevel || 0,
        isAvailable: isAvailable !== false,
        isFeatured: isFeatured || false,
      }).returning();

      return reply.status(201).send({ message: 'Product created', product: newProduct });
    }
  );

  // PATCH /products/:id - Update product (admin only)
  fastify.patch<{ Params: ProductParams }>(
    '/:id',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Params: ProductParams; Body: Record<string, unknown> }>, reply: FastifyReply) => {
      const { id } = request.params;
      const body = request.body as Record<string, unknown>;

      const existing = await db.query.products.findFirst({ where: eq(products.id, parseInt(id)) });
      if (!existing) throw new NotFoundError('Product');

      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) {
        updates.name = body.name;
        updates.slug = (body.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (body.description !== undefined) updates.description = body.description;
      if (body.price !== undefined) updates.price = String(body.price);
      if (body.categoryId !== undefined) updates.categoryId = body.categoryId ? parseInt(String(body.categoryId)) : null;
      if (body.spiceLevel !== undefined) updates.spiceLevel = body.spiceLevel;
      if (body.isAvailable !== undefined) updates.isAvailable = body.isAvailable;
      if (body.isFeatured !== undefined) updates.isFeatured = body.isFeatured;
      updates.updatedAt = new Date();

      const [updated] = await db.update(products).set(updates).where(eq(products.id, parseInt(id))).returning();
      return reply.send({ message: 'Product updated', product: updated });
    }
  );

  // DELETE /products/:id - Delete product (admin only)
  fastify.delete<{ Params: ProductParams }>(
    '/:id',
    { preHandler: [authenticateAdmin] },
    async (request: FastifyRequest<{ Params: ProductParams }>, reply: FastifyReply) => {
      const { id } = request.params;

      const existing = await db.query.products.findFirst({ where: eq(products.id, parseInt(id)) });
      if (!existing) throw new NotFoundError('Product');

      await db.delete(productOptions).where(eq(productOptions.productId, parseInt(id)));
      await db.delete(products).where(eq(products.id, parseInt(id)));

      return reply.send({ message: 'Product deleted' });
    }
  );

  // GET /products/categories/list - List all categories (from products route)
  fastify.get(
    '/categories/list',
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
}
