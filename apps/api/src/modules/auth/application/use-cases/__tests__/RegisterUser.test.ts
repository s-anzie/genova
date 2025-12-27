
import { RegisterUser } from '../RegisterUser';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordService } from '../services/IPasswordService';
import { UserRole } from '../../../domain/entities/User';
import { RegisterUserDto } from '../dtos/RegisterUserDto';

// Mock IUserRepository
const mockUserRepository = {
  save: jest.fn(),
  findByEmail: jest.fn(),
  exists: jest.fn(),
};

// Mock IPasswordService
const mockPasswordService = {
  hash: jest.fn(),
  compare: jest.fn(),
};

describe('RegisterUser Use Case', () => {
  let registerUser: RegisterUser;

  beforeEach(() => {
    registerUser = new RegisterUser(
      mockUserRepository as unknown as IUserRepository,
      mockPasswordService as unknown as IPasswordService
    );
    jest.clearAllMocks();
  });

  it('should successfully register a new user', async () => {
    const request: RegisterUserDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
    };

    mockUserRepository.exists.mockResolvedValue(false);
    mockUserRepository.save.mockResolvedValue(undefined);
    mockPasswordService.hash.mockResolvedValue('hashed_password');

    const result = await registerUser.execute(request);

    expect(result.isSuccess).toBe(true);
    expect(mockUserRepository.exists).toHaveBeenCalledWith(request.email);
    expect(mockPasswordService.hash).toHaveBeenCalledWith(request.password);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should fail if email already exists', async () => {
    const request: RegisterUserDto = {
      email: 'existing@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    mockUserRepository.exists.mockResolvedValue(true);

    const result = await registerUser.execute(request);

    expect(result.isSuccess).toBe(false);
    expect(mockUserRepository.save).not.toHaveBeenCalled();
    expect(mockPasswordService.hash).not.toHaveBeenCalled();
  });
});
