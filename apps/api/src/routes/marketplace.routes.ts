import express from 'express';
import { ProductType } from '@prisma/client';
import * as marketplaceService from '../services/marketplace.service';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '@repo/utils';

const router = express.Router();

/**
 * GET /api/marketplace/products
 * Browse products with filters
 */
router.get('/products', async (req, res, next) => {
  try {
    const {
      subject,
      educationLevel,
      productType,
      minPrice,
      maxPrice,
      sellerId,
      page = '1',
      limit = '20',
    } = req.query;

    const filters: any = {};

    if (subject) filters.subject = subject as string;
    if (educationLevel) filters.educationLevel = educationLevel as string;
    if (productType) filters.productType = productType as ProductType;
    if (minPrice) filters.minPrice = parseFloat(minPrice as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
    if (sellerId) filters.sellerId = sellerId as string;

    const result = await marketplaceService.browseProducts(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketplace/products/:id
 * Get product details
 */
router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await marketplaceService.getProductById(id);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/marketplace/products
 * Create a new product listing (tutors only)
 */
router.post('/products', authenticate, async (req, res, next) => {
  try {
    const sellerId = req.user!.userId;
    const { title, description, productType, subject, educationLevel, price, fileUrl, previewUrl } = req.body;

    // Validate required fields
    if (!title || !productType || !subject || !educationLevel || !price) {
      throw new AppError('Missing required fields', 'VALIDATION_ERROR', 400);
    }

    const product = await marketplaceService.createProduct({
      sellerId,
      title,
      description,
      productType,
      subject,
      educationLevel,
      price: parseFloat(price),
      fileUrl,
      previewUrl,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/marketplace/products/:id
 * Update a product listing
 */
router.put('/products/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user!.userId;
    const { title, description, price, fileUrl, previewUrl, isActive } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (previewUrl !== undefined) updateData.previewUrl = previewUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await marketplaceService.updateProduct(id as string, sellerId, updateData);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/marketplace/products/:id
 * Delete a product listing (soft delete)
 */
router.delete('/products/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user!.userId;

    const result = await marketplaceService.deleteProduct(id as string, sellerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/marketplace/purchase
 * Purchase a product
 */
router.post('/purchase', authenticate, async (req, res, next) => {
  try {
    const buyerId = req.user!.userId;
    const { productId } = req.body;

    if (!productId) {
      throw new AppError('Product ID is required', 'VALIDATION_ERROR', 400);
    }

    const purchase = await marketplaceService.purchaseProduct({
      productId,
      buyerId,
    });

    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketplace/purchases
 * Get user's purchases
 */
router.get('/purchases', authenticate, async (req, res, next) => {
  try {
    const buyerId = req.user!.userId;
    const purchases = await marketplaceService.getUserPurchases(buyerId);
    res.json(purchases);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketplace/products/:id/access
 * Check if user has access to download a product
 */
router.get('/products/:id/access', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const buyerId = req.user!.userId;

    const hasAccess = await marketplaceService.hasUserPurchasedProduct(id as string, buyerId);
    res.json({ hasAccess });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketplace/seller/dashboard
 * Get seller dashboard data
 */
router.get('/seller/dashboard', authenticate, async (req, res, next) => {
  try {
    const sellerId = req.user!.userId;
    const dashboard = await marketplaceService.getSellerDashboard(sellerId);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

export default router;
