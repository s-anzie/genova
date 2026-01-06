
import { Request, Response, NextFunction } from 'express';
import { LoginUser } from '../../application/use-cases/LoginUser';
import { LoginUserDto } from '../../application/dtos/LoginUserDto';

export class LoginController {
  private loginUser: LoginUser;

  constructor(loginUser: LoginUser) {
    this.loginUser = loginUser;
  }

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginUserDto;

      // Basic validation
      if (!dto.email || !dto.password) {
        res.status(400).json({
          message: 'Email and password are required'
        });
        return;
      }

      const result = await this.loginUser.execute(dto);

      if (result.isFailure) {
        // Here we could assume 401 for authentication errors
        // But the use case returns generic errors.
        // We'll check error message or defaulting to 401 for login failure.

        const error = result.errorValue();
        if ((error as any).statusCode) {
             res.status((error as any).statusCode).json({
                message: (error as any).message
             });
             return;
        }

        res.status(401).json({
          message: result.error as string
        });
        return;
      }

      const tokens = result.getValue();

      res.status(200).json({
        success: true,
        data: tokens,
        message: 'Login successful',
      });
    } catch (err) {
      next(err);
    }
  }
}
