
import { Router } from 'express';
import { RegisterController } from '../controllers/RegisterController';
import { RegisterUser } from '../../application/use-cases/RegisterUser';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import prisma from '../../../../shared/infrastructure/prisma-client';

const router = Router();

const userRepository = new PrismaUserRepository(prisma);
const registerUser = new RegisterUser(userRepository);
const registerController = new RegisterController(registerUser);

router.post('/register', (req, res, next) => registerController.handle(req, res, next));

export { router as authRoutesV2 };
