
import { Entity } from '../../../../shared/domain/Entity';
import { Result } from '../../../../shared/domain/Result';

export enum UserRole {
  STUDENT = 'STUDENT',
  TUTOR = 'TUTOR',
  ADMIN = 'ADMIN',
  PARENT = 'PARENT'
}

interface UserProps {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  walletBalance: number;
}

export class User extends Entity<UserProps> {
  get id(): string {
    return this._id;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get passwordHash(): string | undefined {
    return this.props.passwordHash;
  }

  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  public static create(props: UserProps, id?: string): Result<User> {
    const user = new User({
      ...props,
      isActive: props.isActive !== undefined ? props.isActive : true,
      isVerified: props.isVerified !== undefined ? props.isVerified : false,
      walletBalance: props.walletBalance !== undefined ? props.walletBalance : 0
    }, id);

    return Result.ok<User>(user);
  }
}
