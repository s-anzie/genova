
import { LoginUser } from '../LoginUser';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITokenService, AuthTokens } from '../../services/ITokenService';
import { IPasswordService } from '../../services/IPasswordService';
import { LoginUserDto } from '../../dtos/LoginUserDto';
import { User, UserRole } from '../../../domain/entities/User';
import { Result } from '../../../../../shared/domain/Result';

describe('LoginUser Use Case', () => {
  let loginUser: LoginUser;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockPasswordService: jest.Mocked<IPasswordService>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      exists: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
    };

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    loginUser = new LoginUser(
      mockUserRepository,
      mockPasswordService,
      mockTokenService
    );
  });

  it('should successfully login a user', async () => {
    const request: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const user = User.create({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      passwordHash: 'hashed_password',
      isActive: true,
      isVerified: true,
      walletBalance: 0,
    }, 'user-id-123').getValue();

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(true);
    mockTokenService.generateAccessToken.mockReturnValue('access_token');
    mockTokenService.generateRefreshToken.mockResolvedValue('refresh_token');

    const result = await loginUser.execute(request);

    expect(result.isSuccess).toBe(true);
    const tokens = result.getValue();
    expect(tokens.accessToken).toBe('access_token');
    expect(tokens.refreshToken).toBe('refresh_token');

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(request.email);
    expect(mockPasswordService.compare).toHaveBeenCalledWith(request.password, user.passwordHash!);
    expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
    expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(user.id);
  });

  it('should fail if user does not exist', async () => {
    const request: LoginUserDto = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);

    const result = await loginUser.execute(request);

    expect(result.isSuccess).toBe(false);
    expect(result.errorValue()).toMatchObject({ message: 'Invalid email or password' });
  });

  it('should fail if password does not match', async () => {
    const request: LoginUserDto = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const user = User.create({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      passwordHash: 'hashed_password',
      isActive: true,
      isVerified: true,
      walletBalance: 0,
    }, 'user-id-123').getValue();

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordService.compare.mockResolvedValue(false);

    const result = await loginUser.execute(request);

    expect(result.isSuccess).toBe(false);
    expect(result.errorValue()).toMatchObject({ message: 'Invalid email or password' });
  });

  it('should fail if user account is deactivated', async () => {
    const request: LoginUserDto = {
      email: 'inactive@example.com',
      password: 'password123',
    };

    const user = User.create({
      email: 'inactive@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      passwordHash: 'hashed_password',
      isActive: false, // Inactive
      isVerified: true,
      walletBalance: 0,
    }, 'user-id-123').getValue();

    mockUserRepository.findByEmail.mockResolvedValue(user);

    const result = await loginUser.execute(request);

    expect(result.isSuccess).toBe(false);
    expect(result.errorValue()).toMatchObject({ message: 'Account is deactivated' });
  });
});
