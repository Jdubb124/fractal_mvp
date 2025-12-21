import { Request, Response } from 'express';
import { User } from '../models';
import { generateToken } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, company } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    name,
    company,
  });

  // Generate token
  const token = generateToken(user._id.toString());

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
      },
      token,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user by email (include password for comparison)
  const user = await User.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user._id.toString());

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
      },
      token,
    },
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  // This endpoint exists for API consistency and potential token blacklisting
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
        createdAt: user.createdAt,
      },
    },
  });
});

// @desc    Update current user
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, company } = req.body;

  const user = await User.findByIdAndUpdate(
    req.userId,
    { name, company },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        company: user.company,
      },
    },
  });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.userId).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken(user._id.toString());

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: { token },
  });
});