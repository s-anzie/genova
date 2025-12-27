
import { Request, Response, NextFunction } from 'express';
import { RegisterUser } from '../../application/use-cases/RegisterUser';
import { RegisterUserDto } from '../../application/dtos/RegisterUserDto';

export class RegisterController {
  private registerUser: RegisterUser;

  constructor(registerUser: RegisterUser) {
    this.registerUser = registerUser;
  }

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RegisterUserDto;

      // Basic validation
      const missingFields = [];
      if (!dto.email) missingFields.push('email');
      if (!dto.password) missingFields.push('password');
      if (!dto.firstName) missingFields.push('firstName');
      if (!dto.lastName) missingFields.push('lastName');

      if (missingFields.length > 0) {
        res.status(400).json({
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }

      const result = await this.registerUser.execute(dto);

      if (result.isFailure) {
        const error = result.errorValue();
        if ((error as any).statusCode) {
             res.status((error as any).statusCode).json({
                message: (error as any).message
             });
             return;
        }

        res.status(400).json({
          message: result.error as string
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
