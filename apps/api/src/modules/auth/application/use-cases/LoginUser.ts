
import { IUseCase } from '../../../../shared/application/UseCase';
import { LoginUserDto } from '../dtos/LoginUserDto';
import { AuthTokens, ITokenService } from '../services/ITokenService';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordService } from '../services/IPasswordService';
import { Result } from '../../../../shared/domain/Result';
import { AuthenticationError } from '@repo/utils';

export class LoginUser implements IUseCase<LoginUserDto, AuthTokens> {
  private userRepository: IUserRepository;
  private passwordService: IPasswordService;
  private tokenService: ITokenService;

  constructor(
    userRepository: IUserRepository,
    passwordService: IPasswordService,
    tokenService: ITokenService
  ) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
    this.tokenService = tokenService;
  }

  async execute(request: LoginUserDto): Promise<Result<AuthTokens>> {
    const { email, password } = request;

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return Result.fail(new AuthenticationError('Invalid email or password'));
    }

    if (!user.isActive) {
      return Result.fail(new AuthenticationError('Account is deactivated'));
    }

    if (!user.passwordHash) {
       // Should not happen for email/password users, but safety check
       return Result.fail(new AuthenticationError('Invalid email or password'));
    }

    const isPasswordValid = await this.passwordService.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return Result.fail(new AuthenticationError('Invalid email or password'));
    }

    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return Result.ok<AuthTokens>({
      accessToken,
      refreshToken
    });
  }
}
