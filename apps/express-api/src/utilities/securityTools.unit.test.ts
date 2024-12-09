import * as security from './securityTools';
import { User } from '../models/UserStore';
import { JsonWebTokenError } from 'jsonwebtoken';

describe('Services: securityTools', () => {
  const inputPayload: User = {
    id: 1,
    username: 'kendrick',
    last_login_date: new Date(),
  };
  let generatedToken: string;
  let authHeader: string;

  beforeAll(() => {
    generatedToken = security.generateToken(inputPayload);
    authHeader = `Bearer ${generatedToken}`;
  });

  describe('getJwtFromAuthHeader', () => {
    it('should return the jwt token from the Authorization header string', () => {
      expect(security.getJwtFromAuthHeader(authHeader)).toEqual(generatedToken);
    });
    it('should throw an error for an invalid Authorization header', () => {
      expect(() => security.getJwtFromAuthHeader(generatedToken)).toThrow();
    });
  });
  describe('getTokenPayload', () => {
    it('should throw and error for an invalid token', () => {
      expect(() => security.getTokenPayload(generatedToken + 'abc')).toThrow(
        JsonWebTokenError
      );
    });

    it('should return same output as verifyToken()', () => {
      const tokenPayload = security.getTokenPayload(generatedToken);
      const verifiedToken = security.verifyToken(generatedToken);

      expect(verifiedToken).toEqual(tokenPayload);
    });
  });
  describe('generateToken', () => {
    it('should return an encrypted jwt token string', () => {
      expect(generatedToken.length).toBeGreaterThan(64);
    });

    it('should include all input payload properties in the token payload', () => {
      const decodedToken = security.verifyToken(generatedToken);
      const inputPayloadKeys = Object.keys(inputPayload);
      const decodedPayloadKeys = Object.keys(decodedToken);

      inputPayloadKeys.forEach((key) => {
        expect(decodedPayloadKeys).toContain(key);
      });
    });

    it('should add 3 claims to generated token', () => {
      const decodedToken = security.verifyToken(generatedToken);

      expect(decodedToken).not.toEqual(inputPayload);

      const inputPayloadKeys = Object.keys(inputPayload);
      const decodedPayloadKeys = Object.keys(decodedToken);

      expect(inputPayloadKeys).not.toContain('iat');
      expect(inputPayloadKeys).not.toContain('exp');
      expect(inputPayloadKeys).not.toContain('iss');

      expect(decodedPayloadKeys).toContain('iat');
      expect(decodedPayloadKeys).toContain('exp');
      expect(decodedPayloadKeys).toContain('iss');
    });
  });

  describe('verifyToken', () => {
    it('should return the original payload held within the token', () => {
      const tokenPayload = security.verifyToken(generatedToken);

      expect(tokenPayload.username).toEqual(inputPayload.username);
    });

    it('should throw error for an invalid token', () => {
      const token = security.generateToken(inputPayload);

      expect(() => security.verifyToken(token + '24')).toThrow(
        JsonWebTokenError
      );
    });
  });

  describe('hashPassword', () => {
    it('should return a hashed string', () => {
      const password = 'My Super Secret Password';

      const hashedPassword = security.hashPassword(password);

      expect(hashedPassword).not.toEqual(password);
    });
    it('should return a different hashed password for different inputs', () => {
      const password1 = 'My Super Secret Password1';
      const password2 = 'My Super Secret Password2';

      const hashedPassword1 = security.hashPassword(password1);
      const hashedPassword2 = security.hashPassword(password2);

      expect(hashedPassword1).not.toEqual(hashedPassword2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify that a hashed password was created from given input string', () => {
      const password = 'My Super Secret Password';
      const hashedPassword = security.hashPassword(password);

      expect(security.verifyPassword(password, hashedPassword)).toBeTruthy();
    });

    it('should return false when password hash comparison fails', () => {
      const password = 'My Super Secret Password';
      const hashedPassword = security.hashPassword(password);

      expect(
        security.verifyPassword(password, hashedPassword + 'abc')
      ).toBeFalsy();
    });
  });
});
