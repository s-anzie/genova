
import { Router } from 'express';
import { RegisterController } from '../controllers/RegisterController';
import { RegisterUser } from '../../application/use-cases/RegisterUser';
import { LoginController } from '../controllers/LoginController';
import { LoginUser } from '../../application/use-cases/LoginUser';
import { PrismaUserRepository } from '../../infrastructure/repositories/PrismaUserRepository';
import { BcryptPasswordService } from '../../infrastructure/services/BcryptPasswordService';
import { JwtTokenService } from '../../infrastructure/services/JwtTokenService';
import prisma from '../../../../shared/infrastructure/prisma-client';

const router = Router();

// Infrastructure
const userRepository = new PrismaUserRepository(prisma);
const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService(prisma);

// Use Cases
const registerUser = new RegisterUser(userRepository, passwordService);
const loginUser = new LoginUser(userRepository, passwordService, tokenService);

// Controllers
const registerController = new RegisterController(registerUser);
const loginController = new LoginController(loginUser);

router.post('/register', (req, res, next) => registerController.handle(req, res, next));
router.post('/login', (req, res, next) => loginController.handle(req, res, next));

export { router as authRoutesV2 };
