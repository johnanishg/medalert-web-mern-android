import jwt from 'jsonwebtoken';

// Get JWT_SECRET with lazy validation (validates when actually used)
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('❌ ERROR: JWT_SECRET is not set in environment variables!');
    throw new Error('JWT_SECRET must be set in environment variables');
  }
  return secret;
};

// Verify JWT token
export const verifyToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Try to decode without verification first to get token info for debugging
    let decodedWithoutVerification = null;
    try {
      decodedWithoutVerification = jwt.decode(token, { complete: true });
    } catch (decodeError) {
      console.log('⚠️ Token decode error (malformed token):', decodeError.message);
    }

    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret);
    console.log('Token decoded successfully:', decoded.email, decoded.role);
    req.user = decoded;
    next();
  } catch (error) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const secret = getJWTSecret();
    
    // Enhanced error logging
    if (error.name === 'JsonWebTokenError') {
      console.log('⚠️ Token verification error:', error.message);
      
      // Try to decode token to see what's in it
      try {
        const decoded = jwt.decode(token, { complete: true });
        if (decoded) {
          console.log('Token payload (decoded without verification):', {
            userId: decoded.payload?.userId,
            email: decoded.payload?.email,
            role: decoded.payload?.role,
            iat: decoded.payload?.iat ? new Date(decoded.payload.iat * 1000).toISOString() : null,
            exp: decoded.payload?.exp ? new Date(decoded.payload.exp * 1000).toISOString() : null
          });
        }
      } catch (decodeError) {
        console.log('Could not decode token:', decodeError.message);
      }
      
      console.log('JWT_SECRET status:', secret ? 'SET (length: ' + secret.length + ')' : 'NOT SET');
      
      // Provide more specific error message for invalid signature
      if (error.message === 'invalid signature') {
        console.log('⚠️ Token signature invalid - JWT_SECRET mismatch or token signed with different secret');
        return res.status(401).json({ 
          message: 'Invalid token. Please log in again.',
          code: 'INVALID_TOKEN' 
        });
      }
    } else if (error.name === 'TokenExpiredError') {
      console.log('Token expired:', error.message);
      if (error.expiredAt) {
        console.log('Token expired at:', error.expiredAt);
      }
      return res.status(401).json({ 
        message: 'Token expired. Please log in again.',
        code: 'TOKEN_EXPIRED' 
      });
    }
    console.log('Token verification error:', error.name, error.message);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Verify admin token
export const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, getJWTSecret());
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' && error.message === 'invalid signature') {
      return res.status(401).json({ 
        message: 'Invalid token. Please log in again.',
        code: 'INVALID_TOKEN' 
      });
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Verify admin or manager token
export const verifyAdminOrManager = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, getJWTSecret());
    
    if (decoded.role !== 'admin' && decoded.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Admin or Manager privileges required.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' && error.message === 'invalid signature') {
      return res.status(401).json({ 
        message: 'Invalid token. Please log in again.',
        code: 'INVALID_TOKEN' 
      });
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
};
