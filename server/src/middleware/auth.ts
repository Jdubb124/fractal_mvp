import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';
import { AppError, asyncHandler } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

// Protect routes - require authentication
export const protect = asyncHandler(async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  let token: string | undefined;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check for token in cookies (alternative)
  if (!token && req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    throw new AppError('Not authorized - no token provided', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JwtPayload;

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Not authorized - invalid token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Not authorized - token expired', 401);
    }
    throw error;
  }
});

// Generate JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Optional auth - attach user if token exists, but don't require it
export const optionalAuth = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as JwtPayload;

      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
        req.userId = user._id.toString();
      }
    } catch (error) {
      // Token invalid or expired - continue without user
    }
  }

  next();
});