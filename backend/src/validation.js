// validation.js - Input validation and sanitization
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Validate email format
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
  return email;
}

// Validate password strength
export function validatePassword(password) {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters', 'password');
  }
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter', 'password');
  }
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter', 'password');
  }
  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain at least one number', 'password');
  }
  return password;
}

// Validate username
export function validateUsername(username) {
  if (username.length < 3) {
    throw new ValidationError('Username must be at least 3 characters', 'username');
  }
  if (username.length > 20) {
    throw new ValidationError('Username must be at most 20 characters', 'username');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    throw new ValidationError('Username can only contain letters, numbers, hyphens, and underscores', 'username');
  }
  return username;
}

// Validate room name
export function validateRoomName(roomName) {
  if (!roomName || roomName.trim().length === 0) {
    throw new ValidationError('Room name is required', 'roomName');
  }
  if (roomName.length > 50) {
    throw new ValidationError('Room name must be at most 50 characters', 'roomName');
  }
  return roomName.trim();
}

// Sanitize string input (prevent XSS)
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .substring(0, 500); // Max 500 chars
}

// Validate message content
export function validateMessage(message) {
  if (!message || message.trim().length === 0) {
    throw new ValidationError('Message cannot be empty', 'message');
  }
  if (message.length > 500) {
    throw new ValidationError('Message must be at most 500 characters', 'message');
  }
  return sanitizeString(message);
}

// Validate room ID format
export function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    throw new ValidationError('Invalid room ID', 'roomId');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(roomId)) {
    throw new ValidationError('Room ID contains invalid characters', 'roomId');
  }
  return roomId;
}

// Batch validation
export function validateForm(data, schema) {
  const errors = {};
  
  for (const [field, validator] of Object.entries(schema)) {
    try {
      validator(data[field]);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[field] = error.message;
      } else {
        errors[field] = 'Invalid input';
      }
    }
  }
  
  if (Object.keys(errors).length > 0) {
    const err = new Error('Validation failed');
    err.errors = errors;
    throw err;
  }
  
  return data;
}

// Example schema
export const authSchema = {
  email: validateEmail,
  password: validatePassword,
  username: validateUsername
};