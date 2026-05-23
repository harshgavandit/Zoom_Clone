import express from 'express';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeToken, authMiddleware } from '../authMiddleware.js';
import { validateUsername, validatePassword, validateForm, authSchema, ValidationError, sanitizeString } from '../validation.js';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';

const router = express.Router();

// Register endpoint - with MongoDB
router.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'username_password_required',
        message: 'Username and password are required' 
      });
    }

    // Validate username
    try {
      validateUsername(username);
    } catch (err) {
      return res.status(400).json({ 
        success: false,
        error: 'invalid_username',
        message: err.message 
      });
    }

    // Validate password strength
    try {
      validatePassword(password);
    } catch (err) {
      return res.status(400).json({ 
        success: false,
        error: 'weak_password',
        message: err.message 
      });
    }

    // Check if user exists in MongoDB
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'user_exists',
        message: 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const sanitizedName = sanitizeString(name || username);
    
    // Create new user in MongoDB
    const newUser = new User({
      username,
      password,
      passwordHash: hashedPassword,
      name: sanitizedName,
      role: 'user'
    });

    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ 
      success: false,
      error: 'registration_failed',
      message: 'An error occurred during registration' 
    });
  }
});

// Login endpoint - with MongoDB
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate inputs
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'credentials_required',
        message: 'Username and password are required' 
      });
    }

    // Find user in MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password' 
      });
    }

    // Verify password
    const passwordToCheck = user.passwordHash || user.password;
    const isValid = await bcrypt.compare(password, passwordToCheck);
    if (!isValid) {
      return res.status(401).json({ 
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password' 
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), username, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    res.json({ 
      success: true,
      accessToken, 
      refreshToken, 
      user: { 
        id: user._id,
        username, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: 'login_failed',
      message: 'An error occurred during login' 
    });
  }
});

// Improved refresh endpoint
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        error: 'token_required',
        message: 'Refresh token is required' 
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken(decoded.userId, decoded.userId, 'user');

    res.json({ 
      success: true,
      accessToken 
    });
  } catch (err) {
    res.status(403).json({ 
      success: false,
      error: 'token_invalid',
      message: 'Invalid or expired refresh token' 
    });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) revokeToken(token);
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'logout_failed',
      message: 'An error occurred during logout' 
    });
  }
});

export default router;
