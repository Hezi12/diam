const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * מידלוור לבדיקת אימות JWT
 */
const verifyToken = async (req, res, next) => {
  try {
    // קבלת הטוקן מכותרות HTTP
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'אין הרשאה, דרושה התחברות' });
    }
    
    // בדיקת תקפות הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // מציאת המשתמש
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'משתמש לא נמצא' });
    }
    
    // הוספת מידע המשתמש לבקשה
    req.user = user;
    next();
  } catch (error) {
    console.error(`Auth Middleware Error: ${error}`);
    res.status(401).json({ message: 'אין הרשאה, דרושה התחברות' });
  }
};

module.exports = {
  verifyToken
}; 