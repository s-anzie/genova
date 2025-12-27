
import { IUseCase } from '../../../../shared/application/UseCase';
import { RegisterUserDto } from '../dtos/RegisterUserDto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';
import { Result } from '../../../../shared/domain/Result';
import { AppError, ConflictError } from '@repo/utils';
import bcrypt from 'bcrypt';

export class RegisterUser implements IUseCase<RegisterUserDto, void> {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(request: RegisterUserDto): Promise<Result<void>> {
    const { email, password, firstName, lastName, role } = request;

    const emailAlreadyExists = await this.userRepository.exists(email);

    if (emailAlreadyExists) {
      return Result.fail(new ConflictError('Email already registered'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userOrError = User.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.STUDENT,
      isActive: true,
      isVerified: false,
      walletBalance: 0
    });

    if (userOrError.isFailure) {
      return Result.fail(userOrError.error);
    }

    const user = userOrError.getValue();

    await this.userRepository.save(user);

    return Result.ok<void>();
  }
}
