import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentMethodsController {
  // Get all payment methods for the authenticated user
  async getPaymentMethods(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const paymentMethods = await prisma.paymentMethod.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          operator: true,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      res.json({
        success: true,
        data: paymentMethods,
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment methods',
      });
    }
  }

  // Add a new payment method
  async addPaymentMethod(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { operatorId, phoneNumber, accountName, accountHolder } = req.body;

      // Verify operator exists
      const operator = await prisma.mobileMoneyOperator.findUnique({
        where: { id: operatorId },
      });

      if (!operator) {
        return res.status(400).json({
          success: false,
          message: 'Invalid operator',
        });
      }

      // Validate phone number format based on operator
      const phoneRegex = new RegExp(`^\\${operator.phonePrefix}\\d{${operator.phoneLength}}$`);
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: `Invalid phone number format. Expected: ${operator.phonePrefix} + ${operator.phoneLength} digits`,
        });
      }

      // Check if this is the user's first payment method
      const existingMethods = await prisma.paymentMethod.count({
        where: {
          userId,
          isActive: true,
        },
      });

      const isFirstMethod = existingMethods === 0;

      // Create the payment method
      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          operatorId,
          phoneNumber: cleanPhone,
          accountName,
          accountHolder: accountHolder || null,
          isDefault: isFirstMethod,
          isVerified: false,
        },
        include: {
          operator: true,
        },
      });

      res.status(201).json({
        success: true,
        data: paymentMethod,
        message: 'Payment method added successfully',
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add payment method',
      });
    }
  }

  // Set a payment method as default
  async setDefaultPaymentMethod(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      // Verify the payment method belongs to the user
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id,
          userId,
          isActive: true,
        },
      });

      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found',
        });
      }

      // Use a transaction to ensure atomicity
      await prisma.$transaction([
        // Remove default from all other methods
        prisma.paymentMethod.updateMany({
          where: {
            userId,
            isActive: true,
            NOT: { id },
          },
          data: {
            isDefault: false,
          },
        }),
        // Set this method as default
        prisma.paymentMethod.update({
          where: { id },
          data: {
            isDefault: true,
          },
        }),
      ]);

      const updatedMethod = await prisma.paymentMethod.findUnique({
        where: { id },
      });

      res.json({
        success: true,
        data: updatedMethod,
        message: 'Default payment method updated',
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set default payment method',
      });
    }
  }

  // Delete a payment method (soft delete)
  async deletePaymentMethod(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      // Verify the payment method belongs to the user
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id,
          userId,
          isActive: true,
        },
      });

      if (!paymentMethod) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found',
        });
      }

      // Soft delete the payment method
      await prisma.paymentMethod.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      // If this was the default method, set another one as default
      if (paymentMethod.isDefault) {
        const nextMethod = await prisma.paymentMethod.findFirst({
          where: {
            userId,
            isActive: true,
            NOT: { id },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (nextMethod) {
          await prisma.paymentMethod.update({
            where: { id: nextMethod.id },
            data: {
              isDefault: true,
            },
          });
        }
      }

      res.json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment method',
      });
    }
  }

  // Verify a payment method (admin or automated verification)
  async verifyPaymentMethod(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const paymentMethod = await prisma.paymentMethod.update({
        where: { id },
        data: {
          isVerified: isVerified !== undefined ? isVerified : true,
        },
      });

      res.json({
        success: true,
        data: paymentMethod,
        message: 'Payment method verification status updated',
      });
    } catch (error) {
      console.error('Error verifying payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment method',
      });
    }
  }
}
