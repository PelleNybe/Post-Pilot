import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-chars';
  });

  it('signs and verifies JWT using HS256 with optional expiry', () => {
    const token = AuthService.signJWT({ id: 'user-1' }, { expiresIn: '1h' });
    const decoded = AuthService.verifyJWT(token) as { id: string; exp: number };
    expect(decoded.id).toBe('user-1');
    expect(typeof decoded.exp).toBe('number');
  });

  it('encrypts and decrypts payloads using AES-256-GCM', () => {
    const plaintext = 'sensitive-oauth-token';
    const encrypted = AuthService.encryptGCM(plaintext);
    expect(encrypted.split(':').length).toBe(3);
    expect(AuthService.decryptGCM(encrypted)).toBe(plaintext);
  });
});
