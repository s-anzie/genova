import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { OperatorsController } from '../controllers/operators.controller';

console.log('🔧 Loading operators routes...');

const router = Router();
const controller = new OperatorsController();

console.log('🔧 Operators controller created');

// Public routes (operators list)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 GET /operators route hit!');
  try {
    await controller.getOperators(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 GET /operators/:id route hit!');
  try {
    await controller.getOperatorById(req, res);
  } catch (error) {
    next(error);
  }
});

console.log('🔧 Public routes registered');

// Admin routes (require authentication and admin role)
router.post('/', authenticate, controller.createOperator.bind(controller));
router.put('/:id', authenticate, controller.updateOperator.bind(controller));
router.delete('/:id', authenticate, controller.deleteOperator.bind(controller));

console.log('🔧 Admin routes registered');

// Seed route (for initial setup)
router.post('/seed/cameroon', async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 POST /operators/seed/cameroon route hit!');
  try {
    await controller.seedCameroonOperators(req, res);
  } catch (error) {
    next(error);
  }
});

console.log('🔧 Seed route registered');
console.log('🔧 Exporting operators router...');

export default router;
