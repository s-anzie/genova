/**
 * Education Routes
 * 
 * Endpoints for retrieving and managing education system data
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ValidationError } from '@repo/utils';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// COUNTRIES
// ============================================================================

/**
 * GET /api/education/countries
 * Get all active countries with their education systems
 */
router.get('/countries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        phoneCode: true,
        currencyCode: true,
        currencyName: true,
        currencySymbol: true,
      },
    });

    res.json({
      success: true,
      data: countries,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/education/countries
 * Create a new country (Admin only)
 */
router.post('/countries', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, phoneCode, currencyCode, currencyName, currencySymbol, phoneRegex, phoneFormat, phoneExample, timezone } = req.body;

    if (!code || !name || !phoneCode || !currencyCode || !currencyName || !currencySymbol) {
      throw new ValidationError('Code, name, phoneCode, currencyCode, currencyName, and currencySymbol are required');
    }

    const country = await prisma.country.create({
      data: {
        code: code.toUpperCase(),
        name,
        phoneCode,
        phoneRegex: phoneRegex || '^[0-9]{9}$',
        phoneFormat: phoneFormat || 'XXX XXX XXX',
        phoneExample: phoneExample || '600000000',
        currencyCode: currencyCode.toUpperCase(),
        currencyName,
        currencySymbol,
        timezone: timezone || 'Africa/Douala',
        isActive: true,
        sortOrder: 999,
      },
    });

    res.status(201).json({
      success: true,
      data: country,
      message: 'Country created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/education/countries/:id
 * Update a country (Admin only)
 */
router.put('/countries/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, name, phoneCode, currencyCode, currencyName, currencySymbol } = req.body;

    const country = await prisma.country.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        name,
        phoneCode,
        currencyCode: currencyCode?.toUpperCase(),
        currencyName,
        currencySymbol,
      },
    });

    res.json({
      success: true,
      data: country,
      message: 'Country updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/countries/:id
 * Delete a country (Admin only)
 */
router.delete('/countries/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.country.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Country deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EDUCATION SYSTEMS
// ============================================================================

/**
 * GET /api/education/systems
 * Get all education systems, optionally filtered by country
 */
router.get('/systems', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode } = req.query;

    const where: any = { isActive: true };
    
    if (countryCode) {
      where.country = { code: countryCode as string };
    }

    const systems = await prisma.educationSystem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        country: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: systems,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/education/systems
 * Create a new education system (Admin only)
 */
router.post('/systems', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, countryId, sortOrder, isActive } = req.body;

    if (!code || !name || !countryId) {
      throw new ValidationError('Code, name, and countryId are required');
    }

    const system = await prisma.educationSystem.create({
      data: {
        code: code.toUpperCase(),
        name,
        countryId,
        sortOrder: sortOrder || 999,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        country: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: system,
      message: 'Education system created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/education/systems/:id
 * Update an education system (Admin only)
 */
router.put('/systems/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, name, countryId, sortOrder, isActive } = req.body;

    // Get current system to check if code/country changed
    const currentSystem = await prisma.educationSystem.findUnique({
      where: { id },
    });

    if (!currentSystem) {
      return res.status(404).json({
        success: false,
        message: 'Education system not found',
      });
    }

    const upperCode = code?.toUpperCase();
    
    // Check if code or country changed and if the new combination already exists
    if ((upperCode !== currentSystem.code || countryId !== currentSystem.countryId)) {
      const existing = await prisma.educationSystem.findFirst({
        where: {
          countryId,
          code: upperCode,
          id: { not: id },
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Un système avec ce code existe déjà pour ce pays',
        });
      }
    }

    const system = await prisma.educationSystem.update({
      where: { id },
      data: {
        code: upperCode,
        name,
        countryId,
        sortOrder,
        isActive,
      },
      include: {
        country: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: system,
      message: 'Education system updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/systems/:id
 * Delete an education system (Admin only)
 */
router.delete('/systems/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.educationSystem.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Education system deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EDUCATION LEVELS
// ============================================================================

/**
 * GET /api/education/systems/:systemId/levels
 * Get all education levels for a system
 */
router.get('/systems/:systemId/levels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { systemId } = req.params;

    const levels = await prisma.educationLevel.findMany({
      where: {
        systemId,
        isActive: true,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        order: true,
        hasStreams: true,
      },
    });

    res.json({
      success: true,
      data: levels,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/education/systems/:systemId/levels
 * Create a new education level (Admin only)
 */
router.post('/systems/:systemId/levels', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { systemId } = req.params;
    const { code, name, category, order, hasStreams } = req.body;

    if (!code || !name || !category) {
      throw new ValidationError('Code, name, and category are required');
    }

    const level = await prisma.educationLevel.create({
      data: {
        code: code.toUpperCase(),
        name,
        category,
        order: order || 999,
        hasStreams: hasStreams || false,
        system: {
          connect: { id: systemId }
        },
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: level,
      message: 'Education level created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/education/levels/:id
 * Update an education level (Admin only)
 */
router.put('/levels/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, name, category, order, hasStreams } = req.body;

    const level = await prisma.educationLevel.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        name,
        category,
        order,
        hasStreams,
      },
    });

    res.json({
      success: true,
      data: level,
      message: 'Education level updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/levels/:id
 * Delete an education level (Admin only)
 */
router.delete('/levels/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.educationLevel.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Education level deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EDUCATION STREAMS
// ============================================================================

/**
 * GET /api/education/levels/:levelId/streams
 * Get all streams for an education level
 */
router.get('/levels/:levelId/streams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { levelId } = req.params;

    const streams = await prisma.educationStream.findMany({
      where: {
        levelId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });

    res.json({
      success: true,
      data: streams,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/education/levels/:levelId/streams
 * Create a new education stream (Admin only)
 */
router.post('/levels/:levelId/streams', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { levelId } = req.params;
    const { code, name, description } = req.body;

    if (!code || !name) {
      throw new ValidationError('Code and name are required');
    }

    const stream = await prisma.educationStream.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        level: {
          connect: { id: levelId }
        },
        sortOrder: 999,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: stream,
      message: 'Education stream created successfully',
    });
  } catch (error) {
    next(error);
  }
})

/**
 * PUT /api/education/streams/:id
 * Update an education stream (Admin only)
 */
router.put('/streams/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body;

    const stream = await prisma.educationStream.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        name,
        description,
      },
    });

    res.json({
      success: true,
      data: stream,
      message: 'Education stream updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/streams/:id
 * Delete an education stream (Admin only)
 */
router.delete('/streams/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.educationStream.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Education stream deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SUBJECTS
// ============================================================================

/**
 * GET /api/education/countries
 * Get all active countries with their education systems
 */
router.get('/countries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        phoneCode: true,
        currencyCode: true,
        currencyName: true,
        currencySymbol: true,
      },
    });

    res.json({
      success: true,
      data: countries,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/education/systems
 * Get all education systems, optionally filtered by country
 */
router.get('/systems', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode } = req.query;

    const where: any = { isActive: true };
    
    if (countryCode) {
      where.country = { code: countryCode as string };
    }

    const systems = await prisma.educationSystem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        country: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: systems,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/education/systems/:systemId/levels
 * Get all education levels for a system
 */
router.get('/systems/:systemId/levels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { systemId } = req.params;

    const levels = await prisma.educationLevel.findMany({
      where: {
        systemId,
        isActive: true,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        order: true,
        hasStreams: true,
      },
    });

    res.json({
      success: true,
      data: levels,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/education/levels/:levelId/streams
 * Get all streams for an education level
 */
router.get('/levels/:levelId/streams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { levelId } = req.params;

    const streams = await prisma.educationStream.findMany({
      where: {
        levelId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });

    res.json({
      success: true,
      data: streams,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/education/levels/:levelId/subjects
 * Get all subjects available for an education level
 */
router.get('/levels/:levelId/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { levelId } = req.params;
    const { category } = req.query;

    const where: any = {
      levelId,
      subject: { isActive: true },
    };

    if (category) {
      where.subject.category = category;
    }

    const levelSubjects = await prisma.levelSubject.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            nameEn: true,
            category: true,
            icon: true,
            color: true,
          },
        },
        level: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        subject: {
          sortOrder: 'asc',
        },
      },
    });

    res.json({
      success: true,
      data: levelSubjects,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/education/subjects
 * Get all global subjects
 */
router.get('/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;

    const where: any = { isActive: true };
    
    if (category) {
      where.category = category;
    }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        category: true,
        icon: true,
        color: true,
      },
    });

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/education/subjects
 * Create a new subject (Admin only)
 */
router.post('/subjects', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, nameEn, category, icon, color } = req.body;

    if (!code || !name || !category) {
      throw new ValidationError('Code, name, and category are required');
    }

    const subject = await prisma.subject.create({
      data: {
        code: code.toUpperCase(),
        name,
        nameEn,
        category,
        icon,
        color,
        sortOrder: 999,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: subject,
      message: 'Subject created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/education/subjects/:id
 * Update a subject (Admin only)
 */
router.put('/subjects/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, name, nameEn, category, icon, color } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        name,
        nameEn,
        category,
        icon,
        color,
      },
    });

    res.json({
      success: true,
      data: subject,
      message: 'Subject updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/subjects/:id
 * Delete a subject (Admin only)
 */
router.delete('/subjects/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.subject.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LANGUAGES
// ============================================================================

/**
 * GET /api/education/languages
 * Get all teaching languages
 */
router.get('/languages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const languages = await prisma.teachingLanguage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        nativeName: true,
      },
    });

    res.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/education/languages
 * Create a new teaching language (Admin only)
 */
router.post('/languages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, nativeName } = req.body;

    if (!code || !name) {
      throw new ValidationError('Code and name are required');
    }

    const language = await prisma.teachingLanguage.create({
      data: {
        code: code.toLowerCase(),
        name,
        nativeName,
        sortOrder: 999,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: language,
      message: 'Language created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/education/languages/:id
 * Update a teaching language (Admin only)
 */
router.put('/languages/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, name, nativeName } = req.body;

    const language = await prisma.teachingLanguage.update({
      where: { id },
      data: {
        code: code?.toLowerCase(),
        name,
        nativeName,
      },
    });

    res.json({
      success: true,
      data: language,
      message: 'Language updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/languages/:id
 * Delete a teaching language (Admin only)
 */
router.delete('/languages/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.teachingLanguage.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Language deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEVEL SUBJECTS (unchanged)
// ============================================================================

/**
 * GET /api/education/countries/:countryCode/cities
 * Get all cities for a country
 */
router.get('/countries/:countryCode/cities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode } = req.params;

    const country = await prisma.country.findUnique({
      where: { code: countryCode },
    });

    if (!country) {
      throw new ValidationError('Country not found', 'countryCode');
    }

    const cities = await prisma.city.findMany({
      where: {
        countryId: country.id,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        region: true,
      },
    });

    res.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/education/subject-categories
 * Get all subject categories
 */
router.get('/subject-categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = [
      { value: 'SCIENCE', label: 'Sciences', icon: '🔬' },
      { value: 'LANGUAGE', label: 'Langues', icon: '📚' },
      { value: 'HUMANITIES', label: 'Sciences Humaines', icon: '🌍' },
      { value: 'ARTS', label: 'Arts', icon: '🎨' },
      { value: 'SPORTS', label: 'Sports', icon: '⚽' },
      { value: 'TECHNOLOGY', label: 'Technologie', icon: '💻' },
      { value: 'ECONOMICS', label: 'Économie', icon: '💼' },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LEVEL SUBJECTS MANAGEMENT
// ============================================================================

/**
 * POST /api/education/levels/:levelId/subjects
 * Add a subject to a level (Admin only)
 */
router.post('/levels/:levelId/subjects', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { levelId } = req.params;
    const { subjectId, isCore, coefficient, hoursPerWeek } = req.body;

    if (!subjectId) {
      throw new ValidationError('subjectId is required');
    }

    // Check if already exists
    const existing = await prisma.levelSubject.findFirst({
      where: {
        levelId,
        subjectId,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Cette matière est déjà associée à ce niveau',
      });
    }

    const levelSubject = await prisma.levelSubject.create({
      data: {
        level: {
          connect: { id: levelId }
        },
        subject: {
          connect: { id: subjectId }
        },
        isCore: isCore || false,
        coefficient: coefficient || null,
        hoursPerWeek: hoursPerWeek || null,
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: levelSubject,
      message: 'Matière ajoutée au niveau avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/education/level-subjects/:id
 * Update a level subject (Admin only)
 */
router.put('/level-subjects/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isCore, coefficient, hoursPerWeek } = req.body;

    const levelSubject = await prisma.levelSubject.update({
      where: { id },
      data: {
        isCore,
        coefficient,
        hoursPerWeek,
      },
      include: {
        level: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: levelSubject,
      message: 'Matière modifiée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/level-subjects/:id
 * Delete a level subject (Admin only)
 */
router.delete('/level-subjects/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.levelSubject.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Matière supprimée du niveau avec succès',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STREAM SUBJECTS MANAGEMENT
// ============================================================================

/**
 * GET /api/education/streams/:streamId/subjects
 * Get all subjects for a stream
 */
router.get('/streams/:streamId/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { streamId } = req.params;

    const streamSubjects = await prisma.streamSubject.findMany({
      where: { streamId },
      include: {
        stream: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: {
        subject: {
          sortOrder: 'asc',
        },
      },
    });

    res.json({
      success: true,
      data: streamSubjects,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/education/streams/:streamId/subjects
 * Add a subject to a stream (Admin only)
 */
router.post('/streams/:streamId/subjects', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { streamId } = req.params;
    const { subjectId, isCore, coefficient, hoursPerWeek } = req.body;

    if (!subjectId) {
      throw new ValidationError('subjectId is required');
    }

    // Check if already exists
    const existing = await prisma.streamSubject.findFirst({
      where: {
        streamId,
        subjectId,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Cette matière est déjà associée à cette filière',
      });
    }

    const streamSubject = await prisma.streamSubject.create({
      data: {
        stream: {
          connect: { id: streamId }
        },
        subject: {
          connect: { id: subjectId }
        },
        isCore: isCore || false,
        coefficient: coefficient || null,
        hoursPerWeek: hoursPerWeek || null,
      },
      include: {
        stream: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: streamSubject,
      message: 'Matière ajoutée à la filière avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/education/stream-subjects/:id
 * Update a stream subject (Admin only)
 */
router.put('/stream-subjects/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isCore, coefficient, hoursPerWeek } = req.body;

    const streamSubject = await prisma.streamSubject.update({
      where: { id },
      data: {
        isCore,
        coefficient,
        hoursPerWeek,
      },
      include: {
        stream: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: streamSubject,
      message: 'Matière modifiée avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/education/stream-subjects/:id
 * Delete a stream subject (Admin only)
 */
router.delete('/stream-subjects/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.streamSubject.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Matière supprimée de la filière avec succès',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
