import { describe, it, expect } from 'vitest';
import {
  decodeJWT,
  isTokenExpired,
  getTokenExpiry,
  getTimeUntilExpiry
} from './authService';

describe('AuthService', () => {
  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      // Create a test JWT with known payload
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        sub: 'test-user'
      }));
      const signature = 'test-signature';

      const token = `${header}.${payload}.${signature}`;
      const decoded = decodeJWT(token);

      expect(decoded).toBeDefined();
      expect(decoded?.exp).toBeDefined();
      expect(decoded?.sub).toBe('test-user');
    });

    it('should return null for invalid JWT', () => {
      const invalidToken = 'invalid.token';
      const decoded = decodeJWT(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed JWT', () => {
      const malformedToken = 'header.payload'; // Missing signature
      const decoded = decodeJWT(malformedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        sub: 'test-user'
      }));
      const signature = 'test-signature';

      const token = `${header}.${payload}.${signature}`;
      const expired = isTokenExpired(token);

      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        sub: 'test-user'
      }));
      const signature = 'test-signature';

      const token = `${header}.${payload}.${signature}`;
      const expired = isTokenExpired(token);

      expect(expired).toBe(true);
    });

    it('should return true for token expiring within buffer time', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 180, // 3 minutes from now
        iat: Math.floor(Date.now() / 1000),
        sub: 'test-user'
      }));
      const signature = 'test-signature';

      const token = `${header}.${payload}.${signature}`;
      const expired = isTokenExpired(token, 5); // 5 minute buffer

      expect(expired).toBe(true);
    });
  });

  describe('getTokenExpiry', () => {
    it('should return correct expiry date', () => {
      const expiryTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: expiryTime,
        iat: Math.floor(Date.now() / 1000),
        sub: 'test-user'
      }));
      const signature = 'test-signature';

      const token = `${header}.${payload}.${signature}`;
      const expiry = getTokenExpiry(token);

      expect(expiry).toBeDefined();
      expect(expiry?.getTime()).toBeCloseTo(expiryTime * 1000, -2); // Within 100ms
    });

    it('should return null for invalid token', () => {
      const expiry = getTokenExpiry('invalid.token');
      expect(expiry).toBeNull();
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive value for valid token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        sub: 'test-user'
      }));
      const signature = 'test-signature';

      const token = `${header}.${payload}.${signature}`;
      const timeUntilExpiry = getTimeUntilExpiry(token);

      expect(timeUntilExpiry).toBeGreaterThan(0);
      expect(timeUntilExpiry).toBeCloseTo(3600000, -4); // ~1 hour in ms
    });

    it('should return negative value for expired token', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        sub: 'test-user'
      }));
      const signature = 'test-signature';

      const token = `${header}.${payload}.${signature}`;
      const timeUntilExpiry = getTimeUntilExpiry(token);

      expect(timeUntilExpiry).toBeLessThan(0);
    });

    it('should return -1 for invalid token', () => {
      const timeUntilExpiry = getTimeUntilExpiry('invalid.token');
      expect(timeUntilExpiry).toBe(-1);
    });
  });
});
