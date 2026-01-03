import {
  createProduct,
  getProductById,
  browseProducts,
  updateProduct,
  deleteProduct,
  purchaseProduct,
  getUserPurchases,
  hasUserPurchasedProduct,
  getSellerDashboard,
} from '../marketplace.service';
import { cleanDatabase, disconnectDatabase } from '../../test-setup';
import { PrismaClient, Role, ProductType } from '@prisma/client';
import { register } from '../auth.service';

const prisma = new PrismaClient();

describe('Marketplace Service', () => {
  let studentUser: any;
  let tutorUser: any;
  let product: any;

  beforeEach(async () => {
    await cleanDatabase();

    // Create test users
    const studentResult = await register({
      email: 'student@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Test',
    });
    studentUser = studentResult.user;

    const tutorResult = await register({
      email: 'tutor@example.com',
      password: 'password123',
      firstName: 'Tutor',
      lastName: 'Test',
    });
    tutorUser = tutorResult.user;

    // Update tutor role
    await prisma.user.update({
      where: { id: tutorUser.id },
      data: { role: Role.TUTOR },
    });

    // Create tutor profile
    await prisma.tutorProfile.create({
      data: {
        userId: tutorUser.id,
        hourlyRate: 50,
        subjects: ['math'],
        educationLevels: ['high_school'],
        languages: ['en'],
        teachingMode: 'BOTH',
      },
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('createProduct', () => {
    it('should create a product listing', async () => {
      const productData = {
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        description: 'Comprehensive math exercises',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
        fileUrl: 'https://example.com/file.pdf',
        previewUrl: 'https://example.com/preview.pdf',
      };

      const result = await createProduct(productData);

      expect(result).toBeDefined();
      expect(result.title).toBe(productData.title);
      expect(result.sellerId).toBe(tutorUser.id);
      expect(result.price).toEqual(productData.price);
      expect(result.isActive).toBe(true);
    });

    it('should reject product creation with invalid price', async () => {
      const productData = {
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: -10,
      };

      await expect(createProduct(productData)).rejects.toThrow('Product price must be greater than zero');
    });

    it('should reject product creation by non-tutor', async () => {
      const productData = {
        sellerId: studentUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
      };

      await expect(createProduct(productData)).rejects.toThrow('Only tutors can create product listings');
    });
  });

  describe('getProductById', () => {
    beforeEach(async () => {
      product = await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
      });
    });

    it('should retrieve product by ID', async () => {
      const result = await getProductById(product.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(product.id);
      expect(result.title).toBe(product.title);
      expect(result.seller).toBeDefined();
      expect(result.seller.firstName).toBe(tutorUser.firstName);
    });

    it('should throw error for non-existent product', async () => {
      await expect(getProductById('non-existent-id')).rejects.toThrow('Product not found');
    });
  });

  describe('browseProducts', () => {
    beforeEach(async () => {
      // Create multiple products
      await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
      });

      await createProduct({
        sellerId: tutorUser.id,
        title: 'Physics Guide',
        productType: ProductType.BOOK,
        subject: 'physics',
        educationLevel: 'high_school',
        price: 30.00,
      });

      await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Flashcards',
        productType: ProductType.FLASHCARDS,
        subject: 'math',
        educationLevel: 'middle_school',
        price: 15.00,
      });
    });

    it('should browse all products', async () => {
      const result = await browseProducts({}, 1, 10);

      expect(result.products).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter products by subject', async () => {
      const result = await browseProducts({ subject: 'math' }, 1, 10);

      expect(result.products).toHaveLength(2);
      expect(result.products.every(p => p.subject === 'math')).toBe(true);
    });

    it('should filter products by education level', async () => {
      const result = await browseProducts({ educationLevel: 'high_school' }, 1, 10);

      expect(result.products).toHaveLength(2);
      expect(result.products.every(p => p.educationLevel === 'high_school')).toBe(true);
    });

    it('should filter products by price range', async () => {
      const result = await browseProducts({ minPrice: 20, maxPrice: 30 }, 1, 10);

      expect(result.products).toHaveLength(2);
      expect(result.products.every(p => Number(p.price) >= 20 && Number(p.price) <= 30)).toBe(true);
    });

    it('should filter products by product type', async () => {
      const result = await browseProducts({ productType: ProductType.FLASHCARDS }, 1, 10);

      expect(result.products).toHaveLength(1);
      expect(result.products[0].productType).toBe(ProductType.FLASHCARDS);
    });

    it('should paginate results', async () => {
      const result = await browseProducts({}, 1, 2);

      expect(result.products).toHaveLength(2);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('updateProduct', () => {
    beforeEach(async () => {
      product = await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
      });
    });

    it('should update product', async () => {
      const updateData = {
        title: 'Updated Math Workbook',
        price: 29.99,
      };

      const result = await updateProduct(product.id, tutorUser.id, updateData);

      expect(result.title).toBe(updateData.title);
      expect(Number(result.price)).toBeCloseTo(updateData.price, 2);
    });

    it('should reject update by non-owner', async () => {
      const updateData = { title: 'Hacked Title' };

      await expect(updateProduct(product.id, studentUser.id, updateData)).rejects.toThrow(
        'You can only update your own products'
      );
    });

    it('should reject update with invalid price', async () => {
      const updateData = { price: -10 };

      await expect(updateProduct(product.id, tutorUser.id, updateData)).rejects.toThrow(
        'Product price must be greater than zero'
      );
    });
  });

  describe('deleteProduct', () => {
    beforeEach(async () => {
      product = await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
      });
    });

    it('should soft delete product', async () => {
      await deleteProduct(product.id, tutorUser.id);

      const deletedProduct = await prisma.shopProduct.findUnique({
        where: { id: product.id },
      });

      expect(deletedProduct?.isActive).toBe(false);
    });

    it('should reject deletion by non-owner', async () => {
      await expect(deleteProduct(product.id, studentUser.id)).rejects.toThrow(
        'You can only delete your own products'
      );
    });
  });

  describe('purchaseProduct', () => {
    beforeEach(async () => {
      product = await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 100.00,
      });
    });

    it('should purchase a product', async () => {
      const purchase = await purchaseProduct({
        productId: product.id,
        buyerId: studentUser.id,
      });

      expect(purchase).toBeDefined();
      expect(purchase.productId).toBe(product.id);
      expect(purchase.buyerId).toBe(studentUser.id);
      expect(purchase.amountPaid).toEqual(product.price);
    });

    it('should credit seller wallet with 70% of price', async () => {
      const initialBalance = await prisma.user.findUnique({
        where: { id: tutorUser.id },
        select: { walletBalance: true },
      });

      await purchaseProduct({
        productId: product.id,
        buyerId: studentUser.id,
      });

      const updatedBalance = await prisma.user.findUnique({
        where: { id: tutorUser.id },
        select: { walletBalance: true },
      });

      const expectedIncrease = 100 * 0.70; // 70% of 100
      expect(Number(updatedBalance!.walletBalance) - Number(initialBalance!.walletBalance)).toBeCloseTo(
        expectedIncrease,
        2
      );
    });

    it('should increment download count', async () => {
      await purchaseProduct({
        productId: product.id,
        buyerId: studentUser.id,
      });

      const updatedProduct = await prisma.shopProduct.findUnique({
        where: { id: product.id },
      });

      expect(updatedProduct?.downloadsCount).toBe(1);
    });

    it('should prevent duplicate purchases', async () => {
      await purchaseProduct({
        productId: product.id,
        buyerId: studentUser.id,
      });

      await expect(
        purchaseProduct({
          productId: product.id,
          buyerId: studentUser.id,
        })
      ).rejects.toThrow('You have already purchased this product');
    });

    it('should reject purchase of inactive product', async () => {
      await prisma.shopProduct.update({
        where: { id: product.id },
        data: { isActive: false },
      });

      await expect(
        purchaseProduct({
          productId: product.id,
          buyerId: studentUser.id,
        })
      ).rejects.toThrow('This product is no longer available');
    });
  });

  describe('getUserPurchases', () => {
    beforeEach(async () => {
      const product1 = await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
      });

      const product2 = await createProduct({
        sellerId: tutorUser.id,
        title: 'Physics Guide',
        productType: ProductType.BOOK,
        subject: 'physics',
        educationLevel: 'high_school',
        price: 30.00,
      });

      await purchaseProduct({ productId: product1.id, buyerId: studentUser.id });
      await purchaseProduct({ productId: product2.id, buyerId: studentUser.id });
    });

    it('should retrieve user purchases', async () => {
      const purchases = await getUserPurchases(studentUser.id);

      expect(purchases).toHaveLength(2);
      expect(purchases[0].product).toBeDefined();
      expect(purchases[0].product.seller).toBeDefined();
    });
  });

  describe('hasUserPurchasedProduct', () => {
    beforeEach(async () => {
      product = await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 25.99,
      });
    });

    it('should return true for purchased product', async () => {
      await purchaseProduct({ productId: product.id, buyerId: studentUser.id });

      const hasAccess = await hasUserPurchasedProduct(product.id, studentUser.id);
      expect(hasAccess).toBe(true);
    });

    it('should return false for non-purchased product', async () => {
      const hasAccess = await hasUserPurchasedProduct(product.id, studentUser.id);
      expect(hasAccess).toBe(false);
    });
  });

  describe('getSellerDashboard', () => {
    beforeEach(async () => {
      const product1 = await createProduct({
        sellerId: tutorUser.id,
        title: 'Math Workbook',
        productType: ProductType.BOOK,
        subject: 'math',
        educationLevel: 'high_school',
        price: 100.00,
      });

      const product2 = await createProduct({
        sellerId: tutorUser.id,
        title: 'Physics Guide',
        productType: ProductType.BOOK,
        subject: 'physics',
        educationLevel: 'high_school',
        price: 50.00,
      });

      await purchaseProduct({ productId: product1.id, buyerId: studentUser.id });
      await purchaseProduct({ productId: product2.id, buyerId: studentUser.id });
    });

    it('should retrieve seller dashboard data', async () => {
      const dashboard = await getSellerDashboard(tutorUser.id);

      expect(dashboard.totalProducts).toBe(2);
      expect(dashboard.activeProducts).toBe(2);
      expect(dashboard.totalSales).toBe(2);
      expect(dashboard.totalRevenue).toBeCloseTo(105, 2); // (100 + 50) * 0.70
      expect(dashboard.recentSales).toHaveLength(2);
      expect(dashboard.topProducts).toHaveLength(2);
    });
  });
});
