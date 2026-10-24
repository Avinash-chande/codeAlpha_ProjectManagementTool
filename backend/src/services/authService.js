import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user
 * @param {object} userData - { name, email, password }
 * @returns {object} { user, token }
 */
export const registerUser = async ({ name, email, password }) => {
  // Validate input presence
  if (!name || !email || !password) {
    const error = new Error('Please provide name, email, and password.');
    error.statusCode = 400;
    throw error;
  }

  // Check name length
  if (name.trim().length < 2) {
    const error = new Error('Name must be at least 2 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Please provide a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  // Validate password length
  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  // Create new user (pre-save hook in User model securely hashes the password via bcrypt)
  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  await user.save();

  // Generate JWT token
  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Authenticate user credentials and return JWT
 * @param {object} credentials - { email, password }
 * @returns {object} { user, token }
 */
export const loginUser = async ({ email, password }) => {
  // Validate input presence
  if (!email || !password) {
    const error = new Error('Please provide both email and password.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find user by email and explicitly include password for verification
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Verify password using bcrypt compare
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Retrieve user profile by ID
 * @param {string} userId
 * @returns {object} User object without password
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User profile not found.');
    error.statusCode = 404;
    throw error;
  }
  return user.toJSON();
};
