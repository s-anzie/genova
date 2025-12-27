
import { Router } from 'express';
import { authRoutesV2 } from '../modules/auth/presentation/routes/auth.routes.v2';

const router = Router();

router.use('/auth', authRoutesV2);

export default router;
