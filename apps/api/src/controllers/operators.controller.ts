import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OperatorsController {
  // Get all active operators
  async getOperators(req: Request, res: Response) {
    try {
      console.log('🔍 getOperators called');
      console.log('🔍 Query params:', req.query);
      console.log('🔍 Headers:', req.headers.authorization);
      
      const { country } = req.query;

      const where: any = {
        isActive: true,
      };

      if (country) {
        where.country = country;
      }

      const operators = await prisma.mobileMoneyOperator.findMany({
        where,
        orderBy: [
          { country: 'asc' },
          { name: 'asc' },
        ],
      });

      console.log('🔍 Found operators:', operators.length);

      res.json({
        success: true,
        data: operators,
      });
    } catch (error) {
      console.error('Error fetching operators:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch operators',
      });
    }
  }

  // Get operator by ID
  async getOperatorById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const operator = await prisma.mobileMoneyOperator.findUnique({
        where: { id },
      });

      if (!operator) {
        return res.status(404).json({
          success: false,
          message: 'Operator not found',
        });
      }

      res.json({
        success: true,
        data: operator,
      });
    } catch (error) {
      console.error('Error fetching operator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch operator',
      });
    }
  }

  // Create operator (admin only)
  async createOperator(req: Request, res: Response) {
    try {
      const {
        code,
        name,
        displayName,
        provider,
        country,
        countryName,
        currency,
        phonePrefix,
        phoneFormat,
        phoneLength,
        color,
        logoUrl,
        supportedFeatures,
        fees,
        limits,
      } = req.body;

      const operator = await prisma.mobileMoneyOperator.create({
        data: {
          code,
          name,
          displayName,
          provider,
          country,
          countryName,
          currency,
          phonePrefix,
          phoneFormat,
          phoneLength,
          color,
          logoUrl,
          supportedFeatures: supportedFeatures || {},
          fees: fees || {},
          limits: limits || {},
        },
      });

      res.status(201).json({
        success: true,
        data: operator,
        message: 'Operator created successfully',
      });
    } catch (error) {
      console.error('Error creating operator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create operator',
      });
    }
  }

  // Update operator (admin only)
  async updateOperator(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const operator = await prisma.mobileMoneyOperator.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: operator,
        message: 'Operator updated successfully',
      });
    } catch (error) {
      console.error('Error updating operator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update operator',
      });
    }
  }

  // Delete operator (admin only)
  async deleteOperator(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.mobileMoneyOperator.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Operator deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting operator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete operator',
      });
    }
  }

  // Seed default operators for Cameroon
  async seedCameroonOperators(req: Request, res: Response) {
    try {
      console.log('🌱 Seeding Cameroon operators...');
      
      const operators = [
        {
          code: 'ORANGE_MONEY_CM',
          name: 'Orange Money',
          displayName: 'Orange Money Cameroun',
          provider: 'ORANGE_MONEY',
          country: 'CM',
          countryName: 'Cameroun',
          currency: 'XAF',
          phonePrefix: '+237',
          phoneFormat: 'XX XX XX XX XX',
          phoneLength: 9,
          color: '#FF6600',
          supportedFeatures: {
            withdrawal: true,
            deposit: true,
            transfer: true,
          },
          fees: {
            withdrawal: { min: 0, max: 2.5, type: 'percentage' },
            deposit: { min: 0, max: 1.5, type: 'percentage' },
          },
          limits: {
            daily: 500000,
            monthly: 2000000,
            perTransaction: 100000,
          },
        },
        {
          code: 'MTN_MOMO_CM',
          name: 'MTN Mobile Money',
          displayName: 'MTN Mobile Money Cameroun',
          provider: 'MTN_MOBILE_MONEY',
          country: 'CM',
          countryName: 'Cameroun',
          currency: 'XAF',
          phonePrefix: '+237',
          phoneFormat: 'XX XX XX XX XX',
          phoneLength: 9,
          color: '#FFCC00',
          supportedFeatures: {
            withdrawal: true,
            deposit: true,
            transfer: true,
          },
          fees: {
            withdrawal: { min: 0, max: 2.5, type: 'percentage' },
            deposit: { min: 0, max: 1.5, type: 'percentage' },
          },
          limits: {
            daily: 500000,
            monthly: 2000000,
            perTransaction: 100000,
          },
        },
        {
          code: 'MOOV_MONEY_CM',
          name: 'Moov Money',
          displayName: 'Moov Money Cameroun',
          provider: 'MOOV_MONEY',
          country: 'CM',
          countryName: 'Cameroun',
          currency: 'XAF',
          phonePrefix: '+237',
          phoneFormat: 'XX XX XX XX XX',
          phoneLength: 9,
          color: '#009FE3',
          supportedFeatures: {
            withdrawal: true,
            deposit: true,
            transfer: true,
          },
          fees: {
            withdrawal: { min: 0, max: 2.5, type: 'percentage' },
            deposit: { min: 0, max: 1.5, type: 'percentage' },
          },
          limits: {
            daily: 500000,
            monthly: 2000000,
            perTransaction: 100000,
          },
        },
      ];

      const created = [];
      for (const op of operators) {
        const existing = await prisma.mobileMoneyOperator.findUnique({
          where: { code: op.code },
        });

        if (!existing) {
          const operator = await prisma.mobileMoneyOperator.create({
            data: op as any,
          });
          created.push(operator);
        }
      }

      res.json({
        success: true,
        data: created,
        message: `Seeded ${created.length} operators`,
      });
    } catch (error) {
      console.error('Error seeding operators:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed operators',
      });
    }
  }
}
