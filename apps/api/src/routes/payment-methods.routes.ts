import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { PaymentMethodsController } from '../controllers/payment-methods.controller';

const router = Router();
const controller = new PaymentMethodsController();

// All routes require authentication
router.use(authenticate);

// Get all payment methods for current user
router.get('/', controller.getPaymentMethods.bind(controller));

// Add a new payment method
router.post('/', controller.addPaymentMethod.bind(controller));

// Set default payment method
router.patch('/:id/default', controller.setDefaultPaymentMethod.bind(controller));

// Delete a payment method
router.delete('/:id', controller.deletePaymentMethod.bind(controller));

// Verify a payment method (admin or automated verification)
router.patch('/:id/verify', controller.verifyPaymentMethod.bind(controller));

export default router;
