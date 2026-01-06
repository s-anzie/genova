import { PrismaClient, ProductType, TransactionStatus, TransactionType } from '@prisma/client';
import { ValidationError, NotFoundError, ConflictError } from '@repo/utils';

const prisma = new PrismaClient();

const MARKETPLACE_COMMISSION_PERCENTAGE = 0.30; // 30%

interface CreateProductData {
  sellerId: string;
  title: string;
  description?: string;
  productType: ProductType;
  // New education relation
  levelSubjectId?: string; // Reference to LevelSubject (for levels without streams)
  streamSubjectId?: string; // Reference to StreamSubject (for levels with streams)
  // Legacy fields (DEPRECATED - for backward compatibility)
  subject?: string;
  educationLevel?: string;
  price: number;
  fileUrl?: string;
  previewUrl?: string;
}

interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number;
  fileUrl?: string;
  previewUrl?: string;
  isActive?: boolean;
}

interface ProductFilters {
  // New education relation
  levelSubjectId?: string; // Reference to LevelSubject (for levels without streams)
  streamSubjectId?: string; // Reference to StreamSubject (for levels with streams)
  // Legacy fields (DEPRECATED - for backward compatibility)
  subject?: string;
  educationLevel?: string;
  productType?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
}

interface PurchaseProductData {
  productId: string;
  buyerId: string;
}

/**
 * Create a new product listing
 */
export async function createProduct(data: CreateProductData) {
  const { sellerId, title, description, productType, levelSubjectId, streamSubjectId, subject, educationLevel, price, fileUrl, previewUrl } = data;

  // Validate price
  if (price <= 0) {
    throw new ValidationError('Product price must be greater than zero');
  }

  // Check if using new format or legacy format
  if (!levelSubjectId && !streamSubjectId && !subject) {
    throw new ValidationError('Either levelSubjectId, streamSubjectId, or subject is required');
  }

  if (levelSubjectId && streamSubjectId) {
    throw new ValidationError('Cannot specify both levelSubjectId and streamSubjectId');
  }

  // Verify seller exists and is a tutor
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    include: { tutorProfile: true },
  });

  if (!seller) {
    throw new NotFoundError('Seller not found');
  }

  if (!seller.tutorProfile) {
    throw new ValidationError('Only tutors can create product listings');
  }

  // Verify levelSubject or streamSubject exists
  if (levelSubjectId) {
    const levelSubject = await prisma.levelSubject.findUnique({
      where: { id: levelSubjectId },
    });
    if (!levelSubject) {
      throw new NotFoundError('LevelSubject not found');
    }
  }

  if (streamSubjectId) {
    const streamSubject = await prisma.streamSubject.findUnique({
      where: { id: streamSubjectId },
    });
    if (!streamSubject) {
      throw new NotFoundError('StreamSubject not found');
    }
  }

  // Create product
  const product = await prisma.shopProduct.create({
    data: {
      sellerId,
      title,
      description,
      productType,
      levelSubjectId: levelSubjectId || null,
      streamSubjectId: streamSubjectId || null,
      price,
      fileUrl,
      previewUrl,
    },
  });

  return product;
}

/**
 * Get product by ID
 */
export async function getProductById(productId: string) {
  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          tutorProfile: {
            select: {
              averageRating: true,
              totalReviews: true,
            },
          },
        },
      },
      levelSubject: {
        include: {
          subject: true,
          level: true,
        },
      },
      streamSubject: {
        include: {
          subject: true,
          stream: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return product;
}

/**
 * Browse products with filters
 */
export async function browseProducts(filters: ProductFilters, page: number = 1, limit: number = 20) {
  const { levelSubjectId, streamSubjectId, subject, educationLevel, productType, minPrice, maxPrice, sellerId } = filters;

  const where: any = {
    isActive: true,
  };

  // New education relation filter
  if (levelSubjectId) {
    where.levelSubjectId = levelSubjectId;
  }

  if (streamSubjectId) {
    where.streamSubjectId = streamSubjectId;
  }

  // Legacy filters (for backward compatibility)
  if (subject) {
    where.subject = subject;
  }

  if (educationLevel) {
    where.educationLevel = educationLevel;
  }

  if (productType) {
    where.productType = productType;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  if (sellerId) {
    where.sellerId = sellerId;
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.shopProduct.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        levelSubject: {
          include: {
            subject: true,
            level: true,
          },
        },
        streamSubject: {
          include: {
            subject: true,
            stream: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { downloadsCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.shopProduct.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update product
 */
export async function updateProduct(productId: string, sellerId: string, data: UpdateProductData) {
  // Verify product exists and belongs to seller
  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.sellerId !== sellerId) {
    throw new ValidationError('You can only update your own products');
  }

  // Validate price if provided
  if (data.price !== undefined && data.price <= 0) {
    throw new ValidationError('Product price must be greater than zero');
  }

  // Update product
  const updatedProduct = await prisma.shopProduct.update({
    where: { id: productId },
    data,
  });

  return updatedProduct;
}

/**
 * Delete product (soft delete by setting isActive to false)
 */
export async function deleteProduct(productId: string, sellerId: string) {
  // Verify product exists and belongs to seller
  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (product.sellerId !== sellerId) {
    throw new ValidationError('You can only delete your own products');
  }

  // Soft delete
  await prisma.shopProduct.update({
    where: { id: productId },
    data: { isActive: false },
  });

  return { message: 'Product deleted successfully' };
}

/**
 * Purchase a product
 */
export async function purchaseProduct(data: PurchaseProductData) {
  const { productId, buyerId } = data;

  // Verify product exists and is active
  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  if (!product.isActive) {
    throw new ValidationError('This product is no longer available');
  }

  // Check for duplicate purchase
  const existingPurchase = await prisma.shopPurchase.findUnique({
    where: {
      productId_buyerId: {
        productId,
        buyerId,
      },
    },
  });

  if (existingPurchase) {
    throw new ConflictError('You have already purchased this product');
  }

  // Verify buyer exists
  const buyer = await prisma.user.findUnique({
    where: { id: buyerId },
  });

  if (!buyer) {
    throw new NotFoundError('Buyer not found');
  }

  // Calculate commission and seller amount
  const platformCommission = Number(product.price) * MARKETPLACE_COMMISSION_PERCENTAGE;
  const sellerAmount = Number(product.price) - platformCommission;

  // Create transaction and purchase in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        payerId: buyerId,
        payeeId: product.sellerId,
        amount: product.price,
        platformFee: platformCommission,
        netAmount: sellerAmount,
        paymentMethod: 'wallet',
        status: TransactionStatus.COMPLETED,
        transactionType: TransactionType.SHOP_PURCHASE,
      },
    });

    // Create purchase record
    const purchase = await tx.shopPurchase.create({
      data: {
        productId,
        buyerId,
        amountPaid: product.price,
        transactionId: transaction.id,
      },
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Update seller's wallet balance
    await tx.user.update({
      where: { id: product.sellerId },
      data: {
        walletBalance: {
          increment: sellerAmount,
        },
      },
    });

    // Increment download count
    await tx.shopProduct.update({
      where: { id: productId },
      data: {
        downloadsCount: {
          increment: 1,
        },
      },
    });

    return { transaction, purchase };
  });

  return result.purchase;
}

/**
 * Get user's purchases
 */
export async function getUserPurchases(buyerId: string) {
  const purchases = await prisma.shopPurchase.findMany({
    where: { buyerId },
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { purchasedAt: 'desc' },
  });

  return purchases;
}

/**
 * Check if user has purchased a product (for download access)
 */
export async function hasUserPurchasedProduct(productId: string, buyerId: string): Promise<boolean> {
  const purchase = await prisma.shopPurchase.findUnique({
    where: {
      productId_buyerId: {
        productId,
        buyerId,
      },
    },
  });

  return !!purchase;
}

/**
 * Get seller dashboard data
 */
export async function getSellerDashboard(sellerId: string) {
  // Get all products
  const products = await prisma.shopProduct.findMany({
    where: { sellerId },
    include: {
      purchases: true,
    },
  });

  // Calculate total revenue (net amount after commission)
  const totalRevenue = products.reduce((sum, product) => {
    const productRevenue = product.purchases.length * (Number(product.price) * (1 - MARKETPLACE_COMMISSION_PERCENTAGE));
    return sum + productRevenue;
  }, 0);

  // Get recent sales
  const recentSales = await prisma.shopPurchase.findMany({
    where: {
      product: {
        sellerId,
      },
    },
    include: {
      product: true,
      buyer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { purchasedAt: 'desc' },
    take: 10,
  });

  // Get top products by downloads
  const topProducts = products
    .sort((a, b) => b.downloadsCount - a.downloadsCount)
    .slice(0, 5);

  return {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isActive).length,
    totalSales: products.reduce((sum, p) => sum + p.purchases.length, 0),
    totalRevenue,
    recentSales,
    topProducts,
  };
}
