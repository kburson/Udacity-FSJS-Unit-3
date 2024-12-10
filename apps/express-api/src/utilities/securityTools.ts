import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/UserStore';
import { isUndefined } from 'lodash';

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const CRYPTO_PEPPER = process.env.CRYPTO_PEPPER || 'Oh Bless My Soul!';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'God Is Sovereign!';
const TOKEN_EXPIRY_MINUTES = parseInt(process.env.TOKEN_EXPIRY_MINUTES) || 60;

// const BCRYPT_PASSWORD = process.env.BCRYPT_PASSWORD || 'Yankee Doodle Dandy.'

export function getJwtFromAuthHeader(authHeader: string): string {
  if (isUndefined(authHeader) || authHeader.startsWith('Bearer ') === false) {
    throw new Error(
      `invalid Authorization header; missing ${
        isUndefined(authHeader) ? 'Authorization header' : "'Bearer' keyword"
      }`
    );
  }
  return authHeader?.split(' ')[1] as string;
}

// this is basically an alias of 'verifyToken' because it explicitly tells you what it will return.
// this will throw JwtWebTokenError if invalid token
export function getTokenPayload(token: string): JwtPayload {
  return verifyToken(token) as JwtPayload;
}

export function generateToken(user: User): string {
  const tokenOptions = {
    expiresIn: 60 * 1000 * TOKEN_EXPIRY_MINUTES,
    issuer: 'Udacity FSJS',
  };
  const token = jwt.sign(user, TOKEN_SECRET, tokenOptions);
  //console.log("new auth token", token, "\ninput:", getTokenPayload(token));
  return token;
}

// basically wrapping these functions here to keep the secret isolated from the rest of the code.

// throws error on invalid token
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, TOKEN_SECRET) as JwtPayload;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password + CRYPTO_PEPPER, SALT_ROUNDS);
}

export function verifyPassword(
  password: string,
  password_digest: string
): boolean {
  return bcrypt.compareSync(password + CRYPTO_PEPPER, password_digest || '');
}
