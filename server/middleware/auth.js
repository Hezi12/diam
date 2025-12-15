const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { CURRENT_SESSION_VERSION } = require('../config/sessionConfig');

/**
 * מידלוור לבדיקת אימות JWT
 * כולל אימות גרסת סשן גלובלית:
 * כל טוקן שאין בו sessionVersion תואם – נחשב כלא תקף (logout לכולם).
 */
module.exports = async (req, res, next) => {
  try {
    // קבלת הטוקן מכותרות HTTP
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'אין הרשאה, דרושה התחברות' });
    }
    
    // בדיקת תקפות הטוקן
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // אימות גרסת סשן גלובלית - מנתק טוקנים ישנים
    if (!decoded.sessionVersion || decoded.sessionVersion !== CURRENT_SESSION_VERSION) {
      return res.status(401).json({ message: 'הסשן שלך אינו תקף, נא להתחבר מחדש' });
    }
    
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