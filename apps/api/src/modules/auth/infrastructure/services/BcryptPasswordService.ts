
import bcrypt from 'bcrypt';
import { IPasswordService } from '../../application/services/IPasswordService';

const BCRYPT_ROUNDS = 12;

export class BcryptPasswordService implements IPasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
