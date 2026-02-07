import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import {
  db,
  sql as pgSql,
  users,
  categories,
  products,
  productOptions,
  promotions,
  orders,
  orderItems,
  orderStatusHistory,
  seedHistory,
} from '../db';

const SEED_NAME = 'initial_seed_v1';

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
}

interface ProductData {
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  categorySlug: string;
  isFeatured: boolean;
  spiceLevel: number;
  prepTimeMinutes: number;
  calories: number;
}

interface ProductOptionData {
  productSlug: string;
  name: string;
  optionType: 'size' | 'extra' | 'sauce' | 'side';
  priceModifier: number;
  isDefault: boolean;
}

async function checkSeedHistory(): Promise<boolean> {
  try {
    const result = await db.query.seedHistory.findFirst({
      where: eq(seedHistory.seedName, SEED_NAME),
    });
    return !!result;
  } catch {
    // Table might not exist yet
    return false;
  }
}

async function recordSeedCompletion(): Promise<void> {
  await db.insert(seedHistory).values({
    seedName: SEED_NAME,
  }).onConflictDoNothing();
}

async function seedUsers(): Promise<Map<string, number>> {
  console.log('Seeding users...');
  const userMap = new Map<string, number>();

  const usersData = [
    { email: 'admin@tacomex.com', password: 'admin123', name: 'Admin User', role: 'admin' as const },
    { email: 'customer@tacomex.com', password: 'pass123', name: 'Demo Customer', role: 'customer' as const },
    { email: 'maria@example.com', password: 'maria123', name: 'Maria Garcia', role: 'customer' as const },
    { email: 'juan@example.com', password: 'juan123', name: 'Juan Rodriguez', role: 'customer' as const },
  ];

  for (const user of usersData) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(user.password, salt);

    const [result] = await db.insert(users).values({
      email: user.email,
      passwordHash,
      name: user.name,
      role: user.role,
    }).onConflictDoUpdate({
      target: users.email,
      set: { name: user.name },
    }).returning({ id: users.id });

    userMap.set(user.email, result.id);
  }

  console.log(`  Created ${usersData.length} users`);
  return userMap;
}

async function seedCategories(): Promise<Map<string, number>> {
  console.log('Seeding categories...');
  const categoryMap = new Map<string, number>();

  const categoriesData: CategoryData[] = [
    {
      name: 'Tacos',
      slug: 'tacos',
      description: 'Classic Mexican tacos with authentic flavors',
      imageUrl: '/images/categories/tacos.png',
      displayOrder: 1,
    },
    {
      name: 'Burritos',
      slug: 'burritos',
      description: 'Hearty burritos packed with delicious fillings',
      imageUrl: '/images/categories/burritos.png',
      displayOrder: 2,
    },
    {
      name: 'Quesadillas',
      slug: 'quesadillas',
      description: 'Crispy quesadillas with melted cheese',
      imageUrl: '/images/categories/quesadillas.png',
      displayOrder: 3,
    },
    {
      name: 'Sides',
      slug: 'sides',
      description: 'Perfect accompaniments to your meal',
      imageUrl: '/images/categories/sides.png',
      displayOrder: 4,
    },
    {
      name: 'Drinks',
      slug: 'drinks',
      description: 'Refreshing Mexican beverages',
      imageUrl: '/images/categories/drinks.png',
      displayOrder: 5,
    },
    {
      name: 'Desserts',
      slug: 'desserts',
      description: 'Sweet treats to end your meal',
      imageUrl: '/images/categories/desserts.png',
      displayOrder: 6,
    },
  ];

  for (const cat of categoriesData) {
    const [result] = await db.insert(categories).values({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
    }).onConflictDoUpdate({
      target: categories.slug,
      set: { name: cat.name },
    }).returning({ id: categories.id });

    categoryMap.set(cat.slug, result.id);
  }

  console.log(`  Created ${categoriesData.length} categories`);
  return categoryMap;
}

async function seedProducts(categoryMap: Map<string, number>): Promise<Map<string, number>> {
  console.log('Seeding products...');
  const productMap = new Map<string, number>();

  const productsData: ProductData[] = [
    // Tacos
    {
      name: 'Pixel Carne Asada Taco',
      slug: 'pixel-carne-asada-taco',
      description: 'Grilled steak with cilantro, onions, and our secret 8-bit salsa verde',
      price: 4.49,
      imageUrl: '/images/products/carne-asada-taco.png',
      categorySlug: 'tacos',
      isFeatured: true,
      spiceLevel: 2,
      prepTimeMinutes: 10,
      calories: 280,
    },
    {
      name: 'Power-Up Pollo Taco',
      slug: 'power-up-pollo-taco',
      description: 'Seasoned chicken with pico de gallo and queso fresco',
      price: 3.99,
      imageUrl: '/images/products/pollo-taco.png',
      categorySlug: 'tacos',
      isFeatured: true,
      spiceLevel: 1,
      prepTimeMinutes: 8,
      calories: 250,
    },
    {
      name: 'Boss Battle Carnitas Taco',
      slug: 'boss-battle-carnitas-taco',
      description: 'Slow-cooked pork carnitas with pickled onions and guacamole',
      price: 4.99,
      imageUrl: '/images/products/carnitas-taco.png',
      categorySlug: 'tacos',
      isFeatured: false,
      spiceLevel: 1,
      prepTimeMinutes: 10,
      calories: 320,
    },
    {
      name: 'Fireball Al Pastor Taco',
      slug: 'fireball-al-pastor-taco',
      description: 'Marinated pork with pineapple, cilantro, and spicy red salsa',
      price: 4.49,
      imageUrl: '/images/products/al-pastor-taco.png',
      categorySlug: 'tacos',
      isFeatured: true,
      spiceLevel: 3,
      prepTimeMinutes: 10,
      calories: 290,
    },
    {
      name: 'Veggie Quest Taco',
      slug: 'veggie-quest-taco',
      description: 'Grilled vegetables, black beans, avocado, and chipotle crema',
      price: 3.79,
      imageUrl: '/images/products/veggie-taco.png',
      categorySlug: 'tacos',
      isFeatured: false,
      spiceLevel: 1,
      prepTimeMinutes: 8,
      calories: 220,
    },
    {
      name: 'Fish Frenzy Taco',
      slug: 'fish-frenzy-taco',
      description: 'Beer-battered fish with cabbage slaw and lime crema',
      price: 4.79,
      imageUrl: '/images/products/fish-taco.png',
      categorySlug: 'tacos',
      isFeatured: false,
      spiceLevel: 1,
      prepTimeMinutes: 12,
      calories: 310,
    },

    // Burritos
    {
      name: 'Ultimate Combo Burrito',
      slug: 'ultimate-combo-burrito',
      description: 'Carne asada, rice, beans, cheese, sour cream, and guacamole wrapped in a giant flour tortilla',
      price: 12.99,
      imageUrl: '/images/products/combo-burrito.png',
      categorySlug: 'burritos',
      isFeatured: true,
      spiceLevel: 2,
      prepTimeMinutes: 15,
      calories: 980,
    },
    {
      name: 'Level Up Chicken Burrito',
      slug: 'level-up-chicken-burrito',
      description: 'Grilled chicken with Spanish rice, black beans, and chipotle mayo',
      price: 10.99,
      imageUrl: '/images/products/chicken-burrito.png',
      categorySlug: 'burritos',
      isFeatured: false,
      spiceLevel: 2,
      prepTimeMinutes: 12,
      calories: 850,
    },
    {
      name: 'Bean Machine Veggie Burrito',
      slug: 'bean-machine-veggie-burrito',
      description: 'Loaded with rice, three types of beans, roasted vegetables, and salsa verde',
      price: 9.99,
      imageUrl: '/images/products/veggie-burrito.png',
      categorySlug: 'burritos',
      isFeatured: false,
      spiceLevel: 1,
      prepTimeMinutes: 10,
      calories: 720,
    },
    {
      name: 'Breakfast Boss Burrito',
      slug: 'breakfast-boss-burrito',
      description: 'Scrambled eggs, chorizo, potatoes, cheese, and salsa roja',
      price: 9.49,
      imageUrl: '/images/products/breakfast-burrito.png',
      categorySlug: 'burritos',
      isFeatured: false,
      spiceLevel: 2,
      prepTimeMinutes: 12,
      calories: 890,
    },

    // Quesadillas
    {
      name: 'Cheese Quest Quesadilla',
      slug: 'cheese-quest-quesadilla',
      description: 'Classic cheese quesadilla with a blend of Oaxaca and cheddar',
      price: 7.49,
      imageUrl: '/images/products/cheese-quesadilla.png',
      categorySlug: 'quesadillas',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 8,
      calories: 520,
    },
    {
      name: 'Steak Slayer Quesadilla',
      slug: 'steak-slayer-quesadilla',
      description: 'Grilled steak with peppers, onions, and melted cheese',
      price: 11.99,
      imageUrl: '/images/products/steak-quesadilla.png',
      categorySlug: 'quesadillas',
      isFeatured: true,
      spiceLevel: 2,
      prepTimeMinutes: 12,
      calories: 780,
    },
    {
      name: 'Chicken Champion Quesadilla',
      slug: 'chicken-champion-quesadilla',
      description: 'Seasoned chicken, roasted corn, and three-cheese blend',
      price: 10.49,
      imageUrl: '/images/products/chicken-quesadilla.png',
      categorySlug: 'quesadillas',
      isFeatured: false,
      spiceLevel: 1,
      prepTimeMinutes: 10,
      calories: 680,
    },

    // Sides
    {
      name: 'Pixel Chips & Guacamole',
      slug: 'pixel-chips-guacamole',
      description: 'Fresh tortilla chips with house-made guacamole',
      price: 5.99,
      imageUrl: '/images/products/chips-guac.png',
      categorySlug: 'sides',
      isFeatured: true,
      spiceLevel: 1,
      prepTimeMinutes: 5,
      calories: 380,
    },
    {
      name: 'Elote Coins',
      slug: 'elote-coins',
      description: 'Mexican street corn cut into coins with mayo, cotija, and chili powder',
      price: 4.49,
      imageUrl: '/images/products/elote.png',
      categorySlug: 'sides',
      isFeatured: false,
      spiceLevel: 2,
      prepTimeMinutes: 8,
      calories: 220,
    },
    {
      name: 'Refried Bean Bowl',
      slug: 'refried-bean-bowl',
      description: 'Creamy refried beans topped with cheese and chips',
      price: 3.49,
      imageUrl: '/images/products/beans.png',
      categorySlug: 'sides',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 5,
      calories: 280,
    },
    {
      name: 'Spanish Rice',
      slug: 'spanish-rice',
      description: 'Tomato-seasoned rice with herbs',
      price: 2.99,
      imageUrl: '/images/products/rice.png',
      categorySlug: 'sides',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 5,
      calories: 190,
    },

    // Drinks
    {
      name: 'Horchata Potion',
      slug: 'horchata-potion',
      description: 'Sweet rice drink with cinnamon and vanilla',
      price: 3.49,
      imageUrl: '/images/products/horchata.png',
      categorySlug: 'drinks',
      isFeatured: true,
      spiceLevel: 0,
      prepTimeMinutes: 2,
      calories: 180,
    },
    {
      name: 'Agua Fresca Refresh',
      slug: 'agua-fresca-refresh',
      description: 'Fresh fruit water - choice of watermelon, mango, or tamarind',
      price: 3.29,
      imageUrl: '/images/products/agua-fresca.png',
      categorySlug: 'drinks',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 2,
      calories: 120,
    },
    {
      name: 'Mexican Cola',
      slug: 'mexican-cola',
      description: 'Classic Mexican Coca-Cola made with real sugar',
      price: 2.99,
      imageUrl: '/images/products/cola.png',
      categorySlug: 'drinks',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 1,
      calories: 150,
    },
    {
      name: 'Jarritos Soda',
      slug: 'jarritos-soda',
      description: 'Mexican fruit soda - various flavors available',
      price: 2.49,
      imageUrl: '/images/products/jarritos.png',
      categorySlug: 'drinks',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 1,
      calories: 130,
    },

    // Desserts
    {
      name: 'Churro Combo',
      slug: 'churro-combo',
      description: 'Three crispy churros with chocolate dipping sauce',
      price: 5.99,
      imageUrl: '/images/products/churros.png',
      categorySlug: 'desserts',
      isFeatured: true,
      spiceLevel: 0,
      prepTimeMinutes: 8,
      calories: 420,
    },
    {
      name: 'Flan Finale',
      slug: 'flan-finale',
      description: 'Classic Mexican caramel custard',
      price: 4.99,
      imageUrl: '/images/products/flan.png',
      categorySlug: 'desserts',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 5,
      calories: 280,
    },
    {
      name: 'Tres Leches Treasure',
      slug: 'tres-leches-treasure',
      description: 'Three-milk soaked sponge cake with whipped cream',
      price: 5.49,
      imageUrl: '/images/products/tres-leches.png',
      categorySlug: 'desserts',
      isFeatured: false,
      spiceLevel: 0,
      prepTimeMinutes: 5,
      calories: 350,
    },
  ];

  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categorySlug);
    const [result] = await db.insert(products).values({
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      price: prod.price.toString(),
      imageUrl: prod.imageUrl,
      categoryId,
      isFeatured: prod.isFeatured,
      spiceLevel: prod.spiceLevel,
      prepTimeMinutes: prod.prepTimeMinutes,
      calories: prod.calories,
      isAvailable: true,
    }).onConflictDoUpdate({
      target: products.slug,
      set: { name: prod.name },
    }).returning({ id: products.id });

    productMap.set(prod.slug, result.id);
  }

  console.log(`  Created ${productsData.length} products`);
  return productMap;
}

async function seedProductOptions(productMap: Map<string, number>): Promise<void> {
  console.log('Seeding product options...');

  const optionsData: ProductOptionData[] = [
    // Taco sizes (for all tacos)
    ...['pixel-carne-asada-taco', 'power-up-pollo-taco', 'boss-battle-carnitas-taco', 'fireball-al-pastor-taco', 'veggie-quest-taco', 'fish-frenzy-taco'].flatMap((slug) => [
      { productSlug: slug, name: 'Street Size', optionType: 'size' as const, priceModifier: 0, isDefault: true },
      { productSlug: slug, name: 'Super Size', optionType: 'size' as const, priceModifier: 1.50, isDefault: false },
    ]),

    // Burrito sizes
    ...['ultimate-combo-burrito', 'level-up-chicken-burrito', 'bean-machine-veggie-burrito', 'breakfast-boss-burrito'].flatMap((slug) => [
      { productSlug: slug, name: 'Regular', optionType: 'size' as const, priceModifier: 0, isDefault: true },
      { productSlug: slug, name: 'Grande', optionType: 'size' as const, priceModifier: 3.00, isDefault: false },
    ]),

    // Common extras
    ...['pixel-carne-asada-taco', 'power-up-pollo-taco', 'ultimate-combo-burrito', 'steak-slayer-quesadilla'].flatMap((slug) => [
      { productSlug: slug, name: 'Extra Cheese', optionType: 'extra' as const, priceModifier: 1.00, isDefault: false },
      { productSlug: slug, name: 'Extra Guacamole', optionType: 'extra' as const, priceModifier: 1.50, isDefault: false },
      { productSlug: slug, name: 'Extra Sour Cream', optionType: 'extra' as const, priceModifier: 0.75, isDefault: false },
    ]),

    // Sauces
    ...['pixel-carne-asada-taco', 'power-up-pollo-taco', 'fireball-al-pastor-taco', 'ultimate-combo-burrito'].flatMap((slug) => [
      { productSlug: slug, name: 'Salsa Verde', optionType: 'sauce' as const, priceModifier: 0, isDefault: true },
      { productSlug: slug, name: 'Salsa Roja', optionType: 'sauce' as const, priceModifier: 0, isDefault: false },
      { productSlug: slug, name: 'Habanero Fire', optionType: 'sauce' as const, priceModifier: 0.50, isDefault: false },
      { productSlug: slug, name: 'Chipotle Mayo', optionType: 'sauce' as const, priceModifier: 0.50, isDefault: false },
    ]),

    // Drink sizes
    ...['horchata-potion', 'agua-fresca-refresh', 'mexican-cola', 'jarritos-soda'].flatMap((slug) => [
      { productSlug: slug, name: 'Small (12oz)', optionType: 'size' as const, priceModifier: 0, isDefault: true },
      { productSlug: slug, name: 'Medium (20oz)', optionType: 'size' as const, priceModifier: 1.00, isDefault: false },
      { productSlug: slug, name: 'Large (32oz)', optionType: 'size' as const, priceModifier: 1.75, isDefault: false },
    ]),

    // Churro dips
    { productSlug: 'churro-combo', name: 'Chocolate Sauce', optionType: 'sauce' as const, priceModifier: 0, isDefault: true },
    { productSlug: 'churro-combo', name: 'Caramel Sauce', optionType: 'sauce' as const, priceModifier: 0, isDefault: false },
    { productSlug: 'churro-combo', name: 'Dulce de Leche', optionType: 'sauce' as const, priceModifier: 0.50, isDefault: false },
  ];

  let created = 0;
  for (const opt of optionsData) {
    const productId = productMap.get(opt.productSlug);
    if (!productId) continue;

    await db.insert(productOptions).values({
      productId,
      name: opt.name,
      optionType: opt.optionType,
      priceModifier: opt.priceModifier.toString(),
      isDefault: opt.isDefault,
    }).onConflictDoNothing();
    created++;
  }

  console.log(`  Created ${created} product options`);
}

async function seedPromotions(): Promise<Map<string, number>> {
  console.log('Seeding promotions...');
  const promoMap = new Map<string, number>();

  const now = new Date();
  const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const promotionsData = [
    {
      code: 'TACO20',
      description: '20% off your entire order - Taco Tuesday special!',
      discountType: 'percentage' as const,
      discountValue: 20,
      minOrderAmount: 15,
      maxUses: 500,
      startsAt: now,
      expiresAt: threeMonthsLater,
    },
    {
      code: 'BURRITO10',
      description: '$10 off orders over $30 - Burrito bonanza!',
      discountType: 'fixed' as const,
      discountValue: 10,
      minOrderAmount: 30,
      maxUses: 200,
      startsAt: now,
      expiresAt: oneMonthLater,
    },
    {
      code: 'FIRSTORDER',
      description: '15% off your first order - Welcome to TacoMex!',
      discountType: 'percentage' as const,
      discountValue: 15,
      minOrderAmount: 10,
      maxUses: 1000,
      startsAt: now,
      expiresAt: threeMonthsLater,
    },
    {
      code: 'FREEDELIVERY',
      description: 'Free delivery on orders over $25',
      discountType: 'fixed' as const,
      discountValue: 5,
      minOrderAmount: 25,
      maxUses: null,
      startsAt: now,
      expiresAt: threeMonthsLater,
    },
    {
      code: '8BITDEAL',
      description: '8% off - retro gaming special!',
      discountType: 'percentage' as const,
      discountValue: 8,
      minOrderAmount: 0,
      maxUses: null,
      startsAt: now,
      expiresAt: threeMonthsLater,
    },
  ];

  for (const promo of promotionsData) {
    const [result] = await db.insert(promotions).values({
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      minOrderAmount: promo.minOrderAmount.toString(),
      maxUses: promo.maxUses,
      startsAt: promo.startsAt,
      expiresAt: promo.expiresAt,
      isActive: true,
    }).onConflictDoUpdate({
      target: promotions.code,
      set: { description: promo.description },
    }).returning({ id: promotions.id });

    promoMap.set(promo.code, result.id);
  }

  console.log(`  Created ${promotionsData.length} promotions`);
  return promoMap;
}

async function seedOrders(
  userMap: Map<string, number>,
  productMap: Map<string, number>,
  promoMap: Map<string, number>
): Promise<void> {
  console.log('Seeding sample orders...');

  const customerId = userMap.get('customer@tacomex.com')!;
  const mariaId = userMap.get('maria@example.com')!;
  const adminId = userMap.get('admin@tacomex.com')!;

  await pgSql.begin(async (tx) => {
    // Order 1: Delivered order for demo customer
    const [order1] = await tx`
      INSERT INTO orders (user_id, status, subtotal, discount_amount, tax_amount, total, delivery_address, delivery_notes, estimated_delivery, created_at)
      VALUES (${customerId}, 'delivered', 28.46, 0, 2.35, 30.81, '123 Pixel Street, Game City, TX 75001', 'Ring doorbell twice', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
      RETURNING id
    `;

    const productIds1 = [
      productMap.get('pixel-carne-asada-taco'),
      productMap.get('horchata-potion'),
      productMap.get('churro-combo'),
    ];

    await tx`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (${order1.id}, ${productIds1[0]}, 'Pixel Carne Asada Taco', 3, 4.49, 13.47),
             (${order1.id}, ${productIds1[1]}, 'Horchata Potion', 2, 3.49, 6.98),
             (${order1.id}, ${productIds1[2]}, 'Churro Combo', 1, 5.99, 5.99)
    `;

    await tx`
      INSERT INTO order_status_history (order_id, status, notes, created_by, created_at)
      VALUES (${order1.id}, 'pending', 'Order placed', ${customerId}, NOW() - INTERVAL '2 days'),
             (${order1.id}, 'confirmed', 'Payment confirmed', ${adminId}, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
             (${order1.id}, 'preparing', 'Kitchen started', ${adminId}, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
             (${order1.id}, 'ready', 'Ready for delivery', ${adminId}, NOW() - INTERVAL '2 days' + INTERVAL '25 minutes'),
             (${order1.id}, 'delivered', 'Delivered successfully', ${adminId}, NOW() - INTERVAL '2 days' + INTERVAL '45 minutes')
    `;

    // Order 2: Preparing order for Maria
    const promoId = promoMap.get('TACO20');
    const [order2] = await tx`
      INSERT INTO orders (user_id, status, subtotal, discount_amount, tax_amount, total, promotion_id, delivery_address, created_at)
      VALUES (${mariaId}, 'preparing', 42.95, 8.59, 2.83, 37.19, ${promoId}, '456 Retro Avenue, Arcade Town, TX 75002', NOW() - INTERVAL '30 minutes')
      RETURNING id
    `;

    const productIds2 = [
      productMap.get('ultimate-combo-burrito'),
      productMap.get('pixel-chips-guacamole'),
      productMap.get('agua-fresca-refresh'),
    ];

    await tx`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (${order2.id}, ${productIds2[0]}, 'Ultimate Combo Burrito', 2, 12.99, 25.98),
             (${order2.id}, ${productIds2[1]}, 'Pixel Chips & Guacamole', 1, 5.99, 5.99),
             (${order2.id}, ${productIds2[2]}, 'Agua Fresca Refresh', 2, 3.29, 6.58)
    `;

    await tx`
      INSERT INTO order_status_history (order_id, status, notes, created_by, created_at)
      VALUES (${order2.id}, 'pending', 'Order placed', ${mariaId}, NOW() - INTERVAL '30 minutes'),
             (${order2.id}, 'confirmed', 'Payment confirmed', ${adminId}, NOW() - INTERVAL '25 minutes'),
             (${order2.id}, 'preparing', 'Kitchen started', ${adminId}, NOW() - INTERVAL '20 minutes')
    `;

    // Order 3: Pending order for demo customer
    const [order3] = await tx`
      INSERT INTO orders (user_id, status, subtotal, discount_amount, tax_amount, total, delivery_address, delivery_notes, created_at)
      VALUES (${customerId}, 'pending', 19.96, 0, 1.65, 21.61, '123 Pixel Street, Game City, TX 75001', 'Please include extra napkins', NOW() - INTERVAL '5 minutes')
      RETURNING id
    `;

    const productIds3 = [
      productMap.get('fireball-al-pastor-taco'),
      productMap.get('steak-slayer-quesadilla'),
    ];

    await tx`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (${order3.id}, ${productIds3[0]}, 'Fireball Al Pastor Taco', 2, 4.49, 8.98),
             (${order3.id}, ${productIds3[1]}, 'Steak Slayer Quesadilla', 1, 11.99, 11.99)
    `;

    await tx`
      INSERT INTO order_status_history (order_id, status, notes, created_by, created_at)
      VALUES (${order3.id}, 'pending', 'Order placed', ${customerId}, NOW() - INTERVAL '5 minutes')
    `;
  });

  console.log('  Created 3 sample orders with history');
}

async function main() {
  console.log('\n========================================');
  console.log('  TacoMex 8-bit Shop - Database Seeder');
  console.log('  Drizzle ORM Edition');
  console.log('========================================\n');

  try {
    // Check if seed has already run
    const alreadySeeded = await checkSeedHistory();
    if (alreadySeeded) {
      console.log('Database has already been seeded. Skipping...');
      console.log('To re-seed, delete the entry from _seed_history table.\n');
      process.exit(0);
    }

    console.log('Starting seed process...\n');

    // Run seeds in order
    const userMap = await seedUsers();
    const categoryMap = await seedCategories();
    const productMap = await seedProducts(categoryMap);
    await seedProductOptions(productMap);
    const promoMap = await seedPromotions();
    await seedOrders(userMap, productMap, promoMap);

    // Record completion
    await recordSeedCompletion();

    console.log('\n========================================');
    console.log('  Seeding completed successfully!');
    console.log('========================================');
    console.log('\nDemo accounts:');
    console.log('  Admin:    admin@tacomex.com / admin123');
    console.log('  Customer: customer@tacomex.com / pass123');
    console.log('\nPromo codes: TACO20, BURRITO10, FIRSTORDER, FREEDELIVERY, 8BITDEAL\n');

    process.exit(0);
  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  }
}

main();
