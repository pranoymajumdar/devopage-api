import * as crypto from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(crypto.pbkdf2);

export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const iterations = 10000;
  const keyLength = 64;
  const digest = 'sha512';

  const derivedKey = await pbkdf2Async(
    password,
    salt,
    iterations,
    keyLength,
    digest,
  );

  return derivedKey.toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex').normalize();
}

export async function comparePasswords(
  inputPassword: string,
  storedPassword: string,
  salt: string,
): Promise<boolean> {
  const hashedInputPassword = await hashPassword(inputPassword, salt);

  // Using constant-time comparison function to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hashedInputPassword, 'hex'),
    Buffer.from(storedPassword, 'hex'),
  );
}
