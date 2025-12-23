import { ValidationError } from '../errors';

/**
 * Environment configuration manager
 */
export class EnvConfig {
  private static instance: EnvConfig;
  private config: Map<string, string>;

  private constructor() {
    this.config = new Map();
    this.loadEnv();
  }

  static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  private loadEnv() {
    // Load from process.env
    Object.keys(process.env).forEach((key) => {
      const value = process.env[key];
      if (value !== undefined) {
        this.config.set(key, value);
      }
    });
  }

  get(key: string, defaultValue?: string): string {
    const value = this.config.get(key);
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ValidationError(`Environment variable ${key} is not defined`);
    }
    return value;
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`Environment variable ${key} must be a number`);
    }
    return num;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());
    return value.toLowerCase() === 'true';
  }

  getRequired(key: string): string {
    const value = this.config.get(key);
    if (value === undefined) {
      throw new ValidationError(`Required environment variable ${key} is not defined`);
    }
    return value;
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  set(key: string, value: string) {
    this.config.set(key, value);
  }

  isProduction(): boolean {
    return this.get('NODE_ENV', 'development') === 'production';
  }

  isDevelopment(): boolean {
    return this.get('NODE_ENV', 'development') === 'development';
  }

  isTest(): boolean {
    return this.get('NODE_ENV', 'development') === 'test';
  }
}

// Export singleton instance
export const envConfig = EnvConfig.getInstance();
