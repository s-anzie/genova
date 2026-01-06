
import { UserRole } from '../domain/entities/User';

export interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  birthDate?: string;
  preferredLanguage?: string;
}
