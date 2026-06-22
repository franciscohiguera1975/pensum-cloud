export const PASSWORD_SERVICE = Symbol('IPasswordService');

export interface IPasswordService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
