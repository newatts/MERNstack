import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const JWT_ACCESS_EXPIRATION: string = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION: string = process.env.JWT_REFRESH_EXPIRATION || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRATION
  };
  return jwt.sign(payload, JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRATION
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
