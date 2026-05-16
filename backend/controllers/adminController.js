import User from '../models/User.js';
import Book from '../models/Book.js';
import bcrypt from 'bcryptjs';

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, '-passwordHash -refreshToken').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.log('admin error:', err.message);
    next(err);
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id, '-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.log('admin error:', err.message);
    next(err);
  }
};

// PUT /api/admin/users/:id  — change role, username, or email
export const updateUser = async (req, res, next) => {
  try {
    const { role, username, email } = req.body;
    const allowed = {};
    if (role && ['user', 'admin'].includes(role)) allowed.role = role;
    if (username && username.trim()) allowed.username = username.trim();
    if (email && email.trim()) {
      // Check uniqueness
      const existing = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.params.id } });
      if (existing) return res.status(409).json({ message: 'Email already in use' });
      allowed.email = email.trim().toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      allowed,
      { new: true, runValidators: true, select: '-passwordHash -refreshToken' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.log('admin error:', err.message);
    next(err);
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.log('admin error:', err.message);
    next(err);
  }
};

// POST /api/admin/users  — create user directly (admin only)
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user',
    });
    await user.save();
    const { passwordHash: _, refreshToken: __, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) {
    console.log('admin error:', err.message);
    next(err);
  }
};

// GET /api/admin/stats
export const getStats = async (req, res, next) => {
  try {
    const [totalBooks, totalUsers, adminCount, recentBooks, recentUsers] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Book.find().sort({ createdAt: -1 }).limit(5).select('title author createdAt'),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email role createdAt'),
    ]);
    res.status(200).json({ totalBooks, totalUsers, adminCount, recentBooks, recentUsers });
  } catch (err) {
    console.log('admin error:', err.message);
    next(err);
  }
};
