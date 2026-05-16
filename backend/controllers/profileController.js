import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import User from '../models/User.js';

const generateAccessToken = (userId, email, role) =>
  jwt.sign({ userId, email, role, jti: randomUUID() }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId, jti: randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// GET /api/profile/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId, '-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.log('profile error:', err.message);
    next(err);
  }
};

// PUT /api/profile/me  — update username and/or email
export const updateMe = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (username && username.trim()) {
      updates.username = username.trim();
    }

    if (email && email.trim()) {
      const newEmail = email.trim().toLowerCase();
      // Check uniqueness only if email is actually changing
      if (newEmail !== req.user.email) {
        const existing = await User.findOne({ email: newEmail });
        if (existing) {
          return res.status(409).json({ message: 'Email already in use' });
        }
      }
      updates.email = newEmail;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true, select: '-passwordHash -refreshToken' }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Issue new tokens so the client has up-to-date email/role in the JWT
    const newAccessToken  = generateAccessToken(user._id.toString(), user.email, user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());
    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({ user, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.log('profile error:', err.message);
    next(err);
  }
};

// PUT /api/profile/me/password  — change password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.log('profile error:', err.message);
    next(err);
  }
};

// DELETE /api/profile/me  — delete own account
export const deleteMe = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password required to delete account' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    await User.findByIdAndDelete(req.user.userId);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.log('profile error:', err.message);
    next(err);
  }
};
