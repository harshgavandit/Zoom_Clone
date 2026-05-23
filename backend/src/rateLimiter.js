// rateLimiter.js - Prevent API abuse
const requestStore = new Map();

export function createRateLimiter(maxRequests = 30, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestStore.has(key)) {
      requestStore.set(key, []);
    }
    
    const requests = requestStore.get(key);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    requestStore.set(key, recentRequests);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'rate_limit_exceeded',
        message: `Too many requests. Please try again after ${Math.ceil(windowMs / 1000)} seconds.`,
        retryAfter: Math.ceil((windowMs - (now - recentRequests[0])) / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requestStore.set(key, recentRequests);
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', maxRequests - recentRequests.length);
    
    next();
  };
}

// Specific rate limiters for different endpoints
export const authLimiter = createRateLimiter(5, 900000); // 5 requests per 15 minutes
export const apiLimiter = createRateLimiter(100, 60000); // 100 requests per minute
export const socketLimiter = createRateLimiter(50, 60000); // 50 events per minute